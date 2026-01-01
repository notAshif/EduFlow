// lib/services/whatsapp-web.ts
// WhatsApp Web JS service for sending messages to groups and individuals

import { EventEmitter } from 'events';
import { prisma } from '@/lib/db';
import os from 'os';
import fs from 'fs';
import path from 'path';

// We'll use dynamic imports to avoid issues with Next.js SSR
let Client: any;
let LocalAuth: any;

interface WhatsAppMessage {
    to: string; // Phone number or group ID
    message: string;
    isGroup?: boolean;
}

interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
    timestamp?: string;
}

class WhatsAppWebService extends EventEmitter {
    private client: any = null;
    private isReady: boolean = false;
    private qrCode: string | null = null;
    private initPromise: Promise<void> | null = null;
    private organizationId: string | null = null;
    private lastError: string | null = null;

    constructor() {
        super();
    }

    async initialize(organizationId?: string): Promise<void> {
        if (organizationId) {
            this.organizationId = organizationId;
        }

        // Prevent multiple initializations if already running or ready
        if (this.initPromise || this.isReady) {
            return;
        }

        console.log('[WHATSAPP-WEB] Starting background initialization...');
        this.lastError = null;
        this.qrCode = null;

        // Run in background and don't await the whole process
        this.initPromise = this._doInitialize();

        // Handle background completion/failure
        this.initPromise.catch(error => {
            console.error('[WHATSAPP-WEB] Background initialization failed:', error);
            this.lastError = error instanceof Error ? error.message : 'Unknown error';
            this.initPromise = null;
            this.isReady = false;
        });

        // We return immediately to the caller (API) so it doesn't timeout
        return;
    }

    private async findChromiumExecutable(): Promise<string | null> {
        const platform = os.platform();

        // Try to use puppeteer's bundled chromium first
        try {
            const puppeteer = await import('puppeteer-core');
            const execPath = puppeteer.executablePath();
            if (execPath && fs.existsSync(execPath)) {
                console.log('[WHATSAPP-WEB] Found puppeteer bundled chromium:', execPath);
                return execPath;
            }
        } catch (err) {
            console.log('[WHATSAPP-WEB] Puppeteer not available, trying alternatives...');
        }

        // Platform-specific paths
        const searchPaths: string[] = [];

        if (platform === 'linux') {
            searchPaths.push(
                process.env.CHROME_PATH || '',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium',
                '/usr/local/bin/chrome',
                '/usr/local/bin/chromium'
            );
        } else if (platform === 'win32') {
            const userHome = os.homedir();
            const programFiles = process.env['PROGRAMFILES'] || 'C:\\Program Files';
            const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';

            searchPaths.push(
                path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
                path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
                path.join(userHome, 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
                path.join(programFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
                path.join(userHome, 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe')
            );
        } else if (platform === 'darwin') {
            searchPaths.push(
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
                path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
            );
        }

        // Search for the first existing path
        for (const execPath of searchPaths) {
            if (execPath && fs.existsSync(execPath)) {
                console.log(`[WHATSAPP-WEB] Found browser at: ${execPath}`);
                return execPath;
            }
        }

        return null;
    }

    private async _doInitialize(): Promise<void> {
        try {
            console.log('[WHATSAPP-WEB] Loading whatsapp-web.js modules...');
            // Dynamic import for whatsapp-web.js
            const wwebjs = await import('whatsapp-web.js');
            Client = wwebjs.Client;
            LocalAuth = wwebjs.LocalAuth;

            console.log('[WHATSAPP-WEB] Setting up browser options...');


            let puppeteerOpts: any = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            };

            // Detection for Vercel environment - only use sparticuz on Linux
            const isVercel = !!(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL) && os.platform() === 'linux';
            let executablePath: string | null = null;

            if (isVercel) {
                try {
                    console.log('[WHATSAPP-WEB] Vercel environment detected (Linux), loading optimized chromium...');
                    const chromium = (await import('@sparticuz/chromium-min')).default as any;

                    // Note: @sparticuz/chromium-min requires a pack URL in some versions
                    executablePath = await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar');

                    if (executablePath) {
                        puppeteerOpts = {
                            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
                            defaultViewport: chromium.defaultViewport,
                            executablePath: executablePath,
                            headless: chromium.headless,
                        };
                        console.log('[WHATSAPP-WEB] ✓ Successfully loaded chromium for Vercel:', executablePath);
                    }
                } catch (err) {
                    console.error('[WHATSAPP-WEB] ❌ Failed to load @sparticuz/chromium-min:', err);
                }
            }

            // Fallback discovery if not on Vercel or if sparticuz failed
            if (!executablePath) {
                executablePath = await this.findChromiumExecutable();

                if (executablePath) {
                    puppeteerOpts.executablePath = executablePath;
                } else {
                    // Last resort: try to install puppeteer on the fly
                    console.warn('[WHATSAPP-WEB] ⚠️ No browser found. Attempting to use puppeteer with bundled chromium...');

                    try {
                        // Try to dynamically import puppeteer (not puppeteer-core)
                        const puppeteer = await import('puppeteer-core');
                        puppeteerOpts.executablePath = puppeteer.executablePath();
                        console.log('[WHATSAPP-WEB] ✓ Using puppeteer bundled chromium');
                    } catch (puppeteerErr) {
                        console.error('[WHATSAPP-WEB] ❌ ERROR: Could not find any browser executable.');
                        console.error('[WHATSAPP-WEB] Please install Chrome/Chromium or run: npm install puppeteer');
                        throw new Error(
                            'No browser executable found. Please install Chrome/Chromium or add "puppeteer" to your dependencies.'
                        );
                    }
                }
            }

            // Final validation and channel fallback
            if (!executablePath) {
                executablePath = await this.findChromiumExecutable();
            }

            if (executablePath) {
                puppeteerOpts.executablePath = executablePath;
            } else {
                console.log('[WHATSAPP-WEB] No specific executable path found, using "chrome" channel fallback...');
                puppeteerOpts.channel = 'chrome';
            }

            // Absolute path for auth data - Using local tmp to avoid OneDrive locks
            const authPath = path.join(os.tmpdir(), 'flowx_wwebjs_auth');
            console.log(`[WHATSAPP-WEB] Local Auth Path: ${authPath}`);

            // Ensure directory exists
            if (!fs.existsSync(authPath)) {
                try { fs.mkdirSync(authPath, { recursive: true }); } catch (e) { }
            }

            try {
                // Cleanup Windows lock files
                const sessionPath = path.join(authPath, 'session');
                const locks = [
                    path.join(authPath, 'SingletonLock'),
                    path.join(sessionPath, 'SingletonLock')
                ];

                locks.forEach(p => {
                    if (fs.existsSync(p)) {
                        console.log(`[WHATSAPP-WEB] Cleaning lock file: ${p}`);
                        try { fs.unlinkSync(p); } catch (e) { }
                    }
                });
            } catch (e) { }

            // Refine args specifically for Windows/Local environments
            if (os.platform() === 'win32') {
                // Ensure absolute minimum flags and use the stable 'new' headless mode
                puppeteerOpts.headless = 'new';
            }

            console.log('[WHATSAPP-WEB] Launching browser with options...', {
                executablePath: puppeteerOpts.executablePath,
                channel: puppeteerOpts.channel,
                headless: puppeteerOpts.headless,
                authPath
            });

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: authPath
                }),
                puppeteer: puppeteerOpts,
                authTimeoutMs: 120000,
                qrMaxRetries: 10,
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
                }
            });

            // QR Code event
            this.client.on('qr', (qr: string) => {
                console.log('[WHATSAPP-WEB] QR Code received. Scan to authenticate.');
                this.qrCode = qr;
                this.emit('qr', qr);

                // Also try to display in terminal
                import('qrcode-terminal').then(qrcodeTerminal => {
                    qrcodeTerminal.generate(qr, { small: true });
                }).catch(() => {
                    console.log('[WHATSAPP-WEB] QR Code (text):', qr.substring(0, 50) + '...');
                });
            });

            // Ready event
            this.client.on('ready', async () => {
                console.log('[WHATSAPP-WEB] ✓ Client is ready!');
                this.isReady = true;
                this.qrCode = null;
                this.emit('ready');

                // Sync to DB
                if (this.organizationId) {
                    try {
                        const info = await this.client.info;
                        await prisma.integrationConnection.upsert({
                            where: {
                                organizationId_type: {
                                    organizationId: this.organizationId,
                                    type: 'whatsapp-web'
                                }
                            },
                            update: {
                                credentials: { connected: true, sessionId: 'default' },
                                meta: {
                                    phone: info?.wid?.user,
                                    platform: info?.platform,
                                    pushname: info?.pushname,
                                    connectedAt: new Date().toISOString()
                                },
                                updatedAt: new Date()
                            },
                            create: {
                                type: 'whatsapp-web',
                                credentials: { connected: true, sessionId: 'default' },
                                meta: {
                                    phone: info?.wid?.user,
                                    platform: info?.platform,
                                    pushname: info?.pushname,
                                    connectedAt: new Date().toISOString()
                                },
                                organizationId: this.organizationId
                            }
                        });
                        console.log('[WHATSAPP-WEB] Synced connection status to DB');
                    } catch (dbError) {
                        console.error('[WHATSAPP-WEB] Failed to sync to DB:', dbError);
                    }
                }
            });

            // Authentication event
            this.client.on('authenticated', () => {
                console.log('[WHATSAPP-WEB] ✓ Authenticated successfully');
                this.emit('authenticated');
            });

            // Auth failure
            this.client.on('auth_failure', (msg: string) => {
                console.error('[WHATSAPP-WEB] ✗ Authentication failed:', msg);
                this.emit('auth_failure', msg);
            });

            // Disconnected
            this.client.on('disconnected', async (reason: string) => {
                console.log('[WHATSAPP-WEB] Disconnected:', reason);
                this.isReady = false;
                this.emit('disconnected', reason);

                // Sync to DB (Delete or Update)
                if (this.organizationId) {
                    try {
                        await prisma.integrationConnection.deleteMany({
                            where: {
                                organizationId: this.organizationId,
                                type: 'whatsapp-web'
                            }
                        });
                        console.log('[WHATSAPP-WEB] Removed connection status from DB');
                    } catch (dbError) {
                        console.error('[WHATSAPP-WEB] Failed to update DB on disconnect:', dbError);
                    }
                }
            });

            // Initialize the client
            await this.client.initialize();

        } catch (error) {
            console.error('[WHATSAPP-WEB] Initialization error:', error);
            throw error;
        }
    }

    getQRCode(): string | null {
        return this.qrCode;
    }

    isConnected(): boolean {
        const connected = this.isReady && this.client !== null;
        console.log(`[WHATSAPP-WEB] isConnected check: isReady=${this.isReady}, hasClient=${!!this.client}, result=${connected}`);
        return connected;
    }

    async getStatus(): Promise<{
        connected: boolean;
        qrCode: string | null;
        error: string | null;
        initializing: boolean;
        info: any;
    }> {
        return {
            connected: this.isReady,
            qrCode: this.qrCode,
            error: this.lastError,
            initializing: !!this.initPromise && !this.isReady,
            info: this.isReady && this.client ? await this.client.info : null
        };
    }

    // Get all groups
    async getGroups(): Promise<Array<{ id: string; name: string; participants: number }>> {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp Web client not ready');
        }

        const chats = await this.client.getChats();
        const groups = chats
            .filter((chat: any) => chat.isGroup)
            .map((group: any) => ({
                id: group.id._serialized,
                name: group.name,
                participants: group.participants?.length || 0
            }));

        return groups;
    }

    // Get all chats (individuals and groups)
    async getChatsList(): Promise<Array<{ id: string; name: string; isGroup: boolean; participants?: number }>> {
        if (!this.isReady || !this.client) {
            throw new Error('WhatsApp Web client not ready');
        }

        const chats = await this.client.getChats();
        return chats.map((chat: any) => ({
            id: chat.id._serialized,
            name: chat.name || chat.id.user,
            isGroup: chat.isGroup,
            participants: chat.isGroup ? chat.participants?.length : undefined
        }));
    }

    // Send message to phone number or group
    async sendMessage(to: string, message: string, isGroup: boolean = false): Promise<SendResult> {
        if (!this.isReady || !this.client) {
            return {
                success: false,
                error: 'WhatsApp Web client not connected. Please scan QR code first.'
            };
        }

        try {
            let chatId: string;

            if (to.includes('@g.us')) {
                chatId = to;
            } else if (to.includes('@c.us')) {
                chatId = to;
            } else if (isGroup) {
                // For groups, use the group ID directly (e.g., "123456789@g.us")
                chatId = `${to}@g.us`;
            } else {
                // For individuals, format phone number
                const cleanNumber = to.replace(/[^\d]/g, '');
                chatId = `${cleanNumber}@c.us`;
            }

            console.log(`[WHATSAPP-WEB] Sending to: ${chatId}`);

            const sentMessage = await this.client.sendMessage(chatId, message);

            console.log(`[WHATSAPP-WEB] ✓ Message sent, ID: ${sentMessage.id._serialized}`);

            return {
                success: true,
                messageId: sentMessage.id._serialized,
                timestamp: new Date().toISOString()
            };
        } catch (error: any) {
            console.error('[WHATSAPP-WEB] ✗ Send failed:', error);

            // Handle common minified errors or strange objects
            let errorMsg = 'Failed to send message';
            if (error instanceof Error) errorMsg = error.message;
            else if (typeof error === 'string') errorMsg = error;
            else if (error && typeof error === 'object') errorMsg = JSON.stringify(error);

            return {
                success: false,
                error: errorMsg
            };
        }
    }

    // Send to multiple recipients
    async sendBulk(messages: WhatsAppMessage[]): Promise<SendResult[]> {
        const results: SendResult[] = [];

        for (const msg of messages) {
            const result = await this.sendMessage(msg.to, msg.message, msg.isGroup);
            results.push(result);

            // Small delay between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    }

    // Find group by name (partial match)
    async findGroupByName(name: string): Promise<{ id: string; name: string } | null> {
        if (!this.isReady || !this.client) {
            return null;
        }

        const groups = await this.getGroups();
        const found = groups.find(g =>
            g.name.toLowerCase().includes(name.toLowerCase())
        );

        return found ? { id: found.id, name: found.name } : null;
    }

    // Destroy client
    async destroy(): Promise<void> {
        if (this.client) {
            await this.client.destroy();
            this.client = null;
            this.isReady = false;
        }
    }
}

// Singleton instance
let instance: WhatsAppWebService | null = null;

export function getWhatsAppWebService(): WhatsAppWebService {
    if (!instance) {
        instance = new WhatsAppWebService();
    }
    return instance;
}

export { WhatsAppWebService };
export type { WhatsAppMessage, SendResult }