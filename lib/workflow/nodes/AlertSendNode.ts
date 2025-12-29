/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { getWhatsAppWebService } from '@/lib/services/whatsapp-web';


export class AlertSendNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            const { channels, recipients, message, title, priority, whatsappGroupId } = this.config;

            console.log('[ALERT] Starting multi-channel alert');
            console.log('[ALERT] Channels:', channels);
            console.log('[ALERT] Recipients:', recipients);
            console.log('[ALERT] Priority:', priority || 'normal');

            if (!channels || !recipients || !message) {
                throw new Error('Alert node requires "channels", "recipients", and "message" fields');
            }

            const channelList = Array.isArray(channels) ? channels : [channels];
            const results: any[] = [];

            for (const channel of channelList) {
                console.log(`[ALERT] Processing channel: ${channel}`);

                try {
                    switch (channel) {
                        case 'whatsapp':
                            results.push(await this.sendWhatsApp(context, recipients, message, whatsappGroupId));
                            break;
                        case 'email':
                            results.push(await this.sendEmail(context, recipients, title || 'Alert', message));
                            break;
                        case 'slack':
                            results.push(await this.sendSlack(context, message));
                            break;
                        case 'discord':
                            results.push(await this.sendDiscord(context, message));
                            break;
                        case 'sms':
                            results.push({ channel: 'sms', success: false, error: 'SMS (Twilio) has been removed. Please use WhatsApp for messaging.' });
                            break;
                        default:
                            console.warn(`[ALERT] Unknown channel: ${channel}`);
                            results.push({ channel, success: false, error: 'Unknown channel' });
                    }
                } catch (error) {
                    console.error(`[ALERT] ✗ Failed for channel ${channel}:`, error);
                    results.push({
                        channel,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const successCount = results.filter(r => r.success).length;
            const allSuccessful = successCount === channelList.length;

            console.log(`[ALERT] Complete: ${successCount}/${channelList.length} channels successful`);

            return {
                nodeId: context.context.runId,
                success: successCount > 0, // Success if at least one channel worked
                output: {
                    results,
                    priority: priority || 'normal',
                    totalChannels: channelList.length,
                    successfulChannels: successCount,
                    timestamp: new Date().toISOString()
                },
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            console.error('[ALERT] ✗ Fatal error:', error);
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                durationMs: Date.now() - startTime
            };
        }
    }

    private async sendWhatsApp(context: NodeExecutionContext, recipients: string | string[], message: string, whatsappGroupId?: string) {
        let recipientList = typeof recipients === 'string' ? recipients.split(',').map(r => r.trim()).filter(Boolean) : (Array.isArray(recipients) ? recipients : [recipients]);

        // Merge explicitly selected group/chat ID if present
        if (whatsappGroupId && whatsappGroupId !== "none") {
            if (!recipientList.includes(whatsappGroupId)) {
                recipientList = [...recipientList, whatsappGroupId];
            }
        }

        // Use WhatsApp Web service (Twilio removed)
        const whatsappWebService = getWhatsAppWebService();

        if (!whatsappWebService.isConnected()) {
            console.error('[ALERT/WHATSAPP] WhatsApp Web not connected');
            return {
                channel: 'whatsapp',
                success: false,
                error: 'WhatsApp Web not connected. Please scan QR code in Integrations.'
            };
        }

        let successCount = 0;
        const sendResults: any[] = [];

        for (const recipient of recipientList) {
            try {
                // Clean the number/ID
                let cleanTarget = recipient.replace(/^whatsapp:/i, '').trim();

                // SKIP if it looks like an email (contains @ but is not a WhatsApp ID like @c.us or @g.us)
                const isWwebId = cleanTarget.includes('@c.us') || cleanTarget.includes('@g.us');
                if (cleanTarget.includes('@') && !isWwebId) {
                    console.log(`[ALERT/WHATSAPP] Skipping email recipient: ${cleanTarget}`);
                    continue;
                }

                // Determine if it's a group
                const isGroup = cleanTarget.includes('@g.us');

                console.log(`[ALERT/WHATSAPP] Sending via WWeb to: ${cleanTarget}`);
                const result = await whatsappWebService.sendMessage(cleanTarget, message, isGroup);

                if (result.success) {
                    successCount++;
                    sendResults.push({ recipient, success: true, method: 'whatsapp-web', messageId: result.messageId });
                } else {
                    console.error(`[ALERT/WHATSAPP] WWeb failed for ${cleanTarget}:`, result.error);
                    sendResults.push({ recipient, success: false, error: result.error });
                }
            } catch (error) {
                sendResults.push({ recipient, success: false, error: error instanceof Error ? error.message : 'Error' });
            }
        }

        return {
            channel: 'whatsapp',
            success: successCount > 0,
            recipients: recipientList.length,
            successfulSends: successCount,
            details: sendResults
        };
    }

    private async sendEmail(context: NodeExecutionContext, recipients: string | string[], title: string, message: string) {
        console.log('[ALERT/EMAIL] Sending...');
        const recipientList = typeof recipients === 'string' ? recipients.split(',').map(r => r.trim()).filter(r => r.includes('@')) : recipients;

        const creds = context.services?.credentials || {};
        const smtpHost = creds.smtpHost || process.env.SMTP_HOST;
        const smtpUser = creds.smtpUser || process.env.SMTP_USER;
        const smtpPass = creds.smtpPass || process.env.SMTP_PASS;
        const smtpPort = parseInt(creds.smtpPort || process.env.SMTP_PORT || '587');

        if (!smtpHost || !smtpUser || !smtpPass) {
            console.warn('[ALERT/EMAIL] Not configured - simulating');
            return {
                channel: 'email',
                success: true,
                recipients: recipientList.length,
                simulated: true
            };
        }

        try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
                tls: {
                    rejectUnauthorized: false
                }
            });

            for (const recipient of recipientList) {
                await transporter.sendMail({
                    from: smtpUser,
                    to: recipient,
                    subject: title,
                    text: message,
                    html: `<pre>${message}</pre>`,
                });
            }

            console.log(`[ALERT/EMAIL] ✓ Sent to ${recipientList.length} recipients`);
            return {
                channel: 'email',
                success: true,
                recipients: recipientList.length,
                simulated: false
            };
        } catch (error) {
            console.error('[ALERT/EMAIL] ✗ Failed:', error);
            return {
                channel: 'email',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async sendSlack(context: NodeExecutionContext, message: string) {
        console.log('[ALERT/SLACK] Sending...');
        const creds = context.services?.credentials || {};
        const webhookUrl = creds.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('[ALERT/SLACK] Not configured - simulating');
            return { channel: 'slack', success: true, simulated: true };
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: message }),
            });

            const success = response.ok && await response.text() === 'ok';
            return { channel: 'slack', success, simulated: false };
        } catch (error) {
            return {
                channel: 'slack',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async sendDiscord(context: NodeExecutionContext, message: string) {
        console.log('[ALERT/DISCORD] Sending...');
        const creds = context.services?.credentials || {};
        const webhookUrl = creds.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('[ALERT/DISCORD] Not configured - simulating');
            return { channel: 'discord', success: true, simulated: true };
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message }),
            });

            const success = response.ok;
            return { channel: 'discord', success, simulated: false };
        } catch (error) {
            return {
                channel: 'discord',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (!config.channels) {
            throw new Error('Alert node requires "channels" field (whatsapp, email, slack, discord)');
        }
        if (!config.recipients && !config.whatsappGroupId) {
            throw new Error('Alert node requires "recipients" or a selected WhatsApp group');
        }
        if (!config.message) {
            throw new Error('Alert node requires "message" field');
        }
    }
}