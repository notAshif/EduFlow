/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';

export class AlertSendNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            const { channels, recipients, message, title, priority } = this.config;

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
                            results.push(await this.sendWhatsApp(recipients, message));
                            break;
                        case 'email':
                            results.push(await this.sendEmail(recipients, title || 'Alert', message));
                            break;
                        case 'sms':
                            results.push(await this.sendSMS(recipients, message));
                            break;
                        case 'slack':
                            results.push(await this.sendSlack(message));
                            break;
                        case 'discord':
                            results.push(await this.sendDiscord(message));
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
                success: allSuccessful,
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

    private async sendWhatsApp(recipients: string | string[], message: string) {
        console.log('[ALERT/WHATSAPP] Sending...');
        const recipientList = typeof recipients === 'string' ? recipients.split(',').map(r => r.trim()) : recipients;
        
        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';

        if (!twilioAccountSid || !twilioAuthToken) {
            console.warn('[ALERT/WHATSAPP] Not configured - simulating');
            return {
                channel: 'whatsapp',
                success: true,
                recipients: recipientList.length,
                simulated: true
            };
        }

        const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const formattedFrom = twilioWhatsAppFrom.startsWith('whatsapp:') ? twilioWhatsAppFrom : `whatsapp:${twilioWhatsAppFrom}`;

        let successCount = 0;
        for (const recipient of recipientList) {
            try {
                const formattedTo = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;
                
                const response = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            From: formattedFrom,
                            To: formattedTo,
                            Body: message
                        }).toString()
                    }
                );

                if (response.ok) successCount++;
            } catch (error) {
                console.error(`[ALERT/WHATSAPP] Failed for ${recipient}:`, error);
            }
        }

        console.log(`[ALERT/WHATSAPP] ✓ Sent to ${successCount}/${recipientList.length}`);
        return {
            channel: 'whatsapp',
            success: successCount > 0,
            recipients: recipientList.length,
            successfulSends: successCount,
            simulated: false
        };
    }

    private async sendEmail(recipients: string | string[], title: string, message: string) {
        console.log('[ALERT/EMAIL] Sending...');
        const recipientList = typeof recipients === 'string' ? recipients.split(',').map(r => r.trim()) : recipients;

        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

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
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: false,
                auth: { user: smtpUser, pass: smtpPass },
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

    private async sendSMS(recipients: string | string[], message: string) {
        console.log('[ALERT/SMS] Sending...');
        const recipientList = typeof recipients === 'string' ? recipients.split(',').map(r => r.trim()) : recipients;

        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneFrom = process.env.TWILIO_PHONE_NUMBER?.replace('whatsapp:', '') || '+14155238886';

        if (!twilioAccountSid || !twilioAuthToken) {
            console.warn('[ALERT/SMS] Not configured - simulating');
            return {
                channel: 'sms',
                success: true,
                recipients: recipientList.length,
                simulated: true
            };
        }

        const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

        let successCount = 0;
        for (const recipient of recipientList) {
            try {
                const formattedTo = recipient.startsWith('+') ? recipient : `+${recipient}`;
                
                const response = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            From: twilioPhoneFrom,
                            To: formattedTo,
                            Body: message
                        }).toString()
                    }
                );

                if (response.ok) successCount++;
            } catch (error) {
                console.error(`[ALERT/SMS] Failed for ${recipient}:`, error);
            }
        }

        console.log(`[ALERT/SMS] ✓ Sent to ${successCount}/${recipientList.length}`);
        return {
            channel: 'sms',
            success: successCount > 0,
            recipients: recipientList.length,
            successfulSends: successCount,
            simulated: false
        };
    }

    private async sendSlack(message: string) {
        console.log('[ALERT/SLACK] Sending...');
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;

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
            console.log(`[ALERT/SLACK] ${success ? '✓' : '✗'} ${success ? 'Success' : 'Failed'}`);
            
            return { channel: 'slack', success, simulated: false };
        } catch (error) {
            console.error('[ALERT/SLACK] ✗ Failed:', error);
            return {
                channel: 'slack',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private async sendDiscord(message: string) {
        console.log('[ALERT/DISCORD] Sending...');
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

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
            console.log(`[ALERT/DISCORD] ${success ? '✓' : '✗'} ${success ? 'Success' : 'Failed'}`);
            
            return { channel: 'discord', success, simulated: false };
        } catch (error) {
            console.error('[ALERT/DISCORD] ✗ Failed:', error);
            return {
                channel: 'discord',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (!config.channels) {
            throw new Error('Alert node requires "channels" field (whatsapp, email, sms, slack, discord)');
        }
        if (!config.recipients) {
            throw new Error('Alert node requires "recipients" field');
        }
        if (!config.message) {
            throw new Error('Alert node requires "message" field');
        }
    }
}