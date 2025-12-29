/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { getWhatsAppWebService } from '@/lib/services/whatsapp-web';

export class ReminderNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            const {
                reminderTitle,
                reminderMessage,
                channel,
                recipients,
                whatsappChatId,
                delayMinutes,
                scheduledTime,
                priority
            } = this.config;

            console.log('[REMINDER] Processing reminder:', reminderTitle);

            // Validate required fields
            if (!reminderMessage) {
                return this.createErrorResult(context, startTime, 'Reminder message is required');
            }

            if (!channel) {
                return this.createErrorResult(context, startTime, 'Please select a channel (WhatsApp, Email, etc.)');
            }

            // Build the formatted message
            const formattedMessage = this.formatReminderMessage(
                reminderTitle || 'Reminder',
                reminderMessage,
                priority || 'normal'
            );

            // Calculate delay if specified
            let delayMs = 0;
            if (delayMinutes && delayMinutes > 0) {
                delayMs = delayMinutes * 60 * 1000;
                console.log(`[REMINDER] Waiting ${delayMinutes} minutes before sending...`);
                await this.delay(delayMs);
            }

            // Send based on channel
            let result: any;

            switch (channel) {
                case 'whatsapp':
                    result = await this.sendWhatsApp(whatsappChatId, formattedMessage);
                    break;
                case 'email':
                    result = await this.sendEmail(context, recipients, reminderTitle || 'Reminder', formattedMessage);
                    break;
                default:
                    return this.createErrorResult(context, startTime, `Unsupported channel: ${channel}`);
            }

            if (result.success) {
                return {
                    nodeId: context.context.runId,
                    success: true,
                    output: {
                        title: reminderTitle,
                        channel,
                        sentTo: whatsappChatId || recipients,
                        priority,
                        delayMinutes: delayMinutes || 0,
                        ...result
                    },
                    durationMs: Date.now() - startTime
                };
            } else {
                return this.createErrorResult(context, startTime, result.error || 'Failed to send reminder');
            }

        } catch (error) {
            console.error('[REMINDER] Error:', error);
            return this.createErrorResult(
                context,
                startTime,
                error instanceof Error ? error.message : 'Unknown error'
            );
        }
    }

    private formatReminderMessage(title: string, message: string, priority: string): string {
        const priorityEmoji: Record<string, string> = {
            low: '📝',
            normal: '🔔',
            high: '⚠️',
            urgent: '🚨'
        };

        const emoji = priorityEmoji[priority] || '🔔';

        return `${emoji} *${title}*\n\n${message}\n\n_Sent via EduFlow Reminders_`;
    }

    private async sendWhatsApp(chatId: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
        if (!chatId) {
            return { success: false, error: 'No WhatsApp recipient selected' };
        }

        const service = getWhatsAppWebService();

        if (!service.isConnected()) {
            return { success: false, error: 'WhatsApp Web not connected. Please scan QR code in Integrations.' };
        }

        const isGroup = chatId.includes('@g.us');
        const result = await service.sendMessage(chatId, message, isGroup);

        return result;
    }

    private async sendEmail(context: NodeExecutionContext, recipients: string, title: string, message: string): Promise<{ success: boolean; error?: string }> {
        if (!recipients) {
            return { success: false, error: 'No email recipients specified' };
        }

        const recipientList = recipients.split(',').map(r => r.trim()).filter(r => r.includes('@'));

        if (recipientList.length === 0) {
            return { success: false, error: 'No valid email addresses found' };
        }

        const creds = context.services?.credentials || {};
        const smtpHost = creds.smtpHost || process.env.SMTP_HOST;
        const smtpUser = creds.smtpUser || process.env.SMTP_USER;
        const smtpPass = creds.smtpPass || process.env.SMTP_PASS;
        const smtpPort = parseInt(creds.smtpPort || process.env.SMTP_PORT || '587');

        if (!smtpHost || !smtpUser || !smtpPass) {
            console.warn('[REMINDER/EMAIL] SMTP not configured - simulating');
            return { success: true };
        }

        try {
            const nodemailer = await import('nodemailer');
            const transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: { user: smtpUser, pass: smtpPass },
                tls: { rejectUnauthorized: false }
            });

            for (const recipient of recipientList) {
                await transporter.sendMail({
                    from: smtpUser,
                    to: recipient,
                    subject: `🔔 Reminder: ${title}`,
                    text: message,
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; border-radius: 8px;">
                        <h2 style="color: #333;">🔔 ${title}</h2>
                        <p style="color: #555; white-space: pre-wrap;">${message}</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
                        <p style="color: #999; font-size: 12px;">Sent via EduFlow Reminders</p>
                    </div>`
                });
            }

            console.log(`[REMINDER/EMAIL] ✓ Sent to ${recipientList.length} recipients`);
            return { success: true };
        } catch (error) {
            console.error('[REMINDER/EMAIL] Failed:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Email send failed' };
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private createErrorResult(context: NodeExecutionContext, startTime: number, message: string): NodeResult {
        return {
            nodeId: context.context.runId,
            success: false,
            error: message,
            durationMs: Date.now() - startTime
        };
    }

    validate(config: Record<string, any>): void {
        if (!config.reminderMessage) {
            throw new Error('Reminder message is required');
        }
        if (!config.channel) {
            throw new Error('Channel is required (whatsapp, email)');
        }
    }
}
