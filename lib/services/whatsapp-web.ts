// lib/services/whatsapp-web.ts
// WhatsApp Web JS service for sending messages to groups and individuals

import { EventEmitter } from 'events';
import { prisma } from '@/lib/db';
import os from 'os';
import fs from 'fs';

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

    private async _doInitialize(): Promise<void> {
        try {
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
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            };

            // Use @sparticuz/chromium on Vercel
            if (process.env.VERCEL) {
                try {
                    const chromium = (await import('@sparticuz/chromium-min')).default as any;
                    puppeteerOpts = {
                        args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                        defaultViewport: chromium.defaultViewport,
                        executablePath: await chromium.executablePath(),
                        headless: chromium.headless || true,
                    };
                    console.log('[WHATSAPP-WEB] Using @sparticuz/chromium for Vercel');
                } catch (err) {
                    console.error('[WHATSAPP-WEB] Failed to load @sparticuz/chromium:', err);
                }
            } else if (os.platform() === 'linux' && process.env.NODE_ENV === 'production' && !process.env.LOCAL_PROD) {
                // On Railway/Render (Linux), we expect Chromium to be installed in the environment
                puppeteerOpts.executablePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
                console.log('[WHATSAPP-WEB] Using system Chromium for Linux production');
            } else {
                // Dev mode or Local Windows/Mac - Search for any Chromium browser
                const platform = os.platform();
                const userHome = os.homedir();

                if (platform === 'win32') {
                    const paths = [
                        // System-wide Chrome
                        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                        // User-level Chrome
                        `${userHome}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`,
                        // System-wide Edge
                        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
                        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
                        // User-level Edge
                        `${userHome}\\AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe`,
                        // Brave
                        'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
                        `${userHome}\\AppData\\Local\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
                    ];

                    for (const path of paths) {
                        try {
                            if (fs.existsSync(path)) {
                                puppeteerOpts.executablePath = path;
                                console.log(`[WHATSAPP-WEB] Found local browser: ${path}`);
                                break;
                            }
                        } catch (e) { }
                    }
                } else if (platform === 'darwin') {
                    const paths = [
                        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
                        '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
                    ];
                    for (const path of paths) {
                        try {
                            if (fs.existsSync(path)) {
                                puppeteerOpts.executablePath = path;
                                console.log(`[WHATSAPP-WEB] Found local browser: ${path}`);
                                break;
                            }
                        } catch (e) { }
                    }
                }

                if (!puppeteerOpts.executablePath) {
                    console.error('[WHATSAPP-WEB] ERROR: No browser found. WhatsApp Web will fail to launch.');
                }
            }

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: (process.env.NODE_ENV === 'production' || process.env.VERCEL)
                        ? os.tmpdir() + '/.wwebjs_auth'
                        : './.wwebjs_auth'
                }),
                puppeteer: puppeteerOpts
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
        return this.isReady;
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

            if (isGroup) {
                // For groups, use the group ID directly (e.g., "123456789@g.us")
                chatId = to.includes('@g.us') ? to : `${to}@g.us`;
            } else {
                // For individuals, format phone number
                // Remove any non-numeric characters except +
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
        } catch (error) {
            console.error('[WHATSAPP-WEB] ✗ Send failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to send message'
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
export type { WhatsAppMessage, SendResult };
