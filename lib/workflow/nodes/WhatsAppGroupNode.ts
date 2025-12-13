/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { getWhatsAppWebService } from '@/lib/services/whatsapp-web';

export class WhatsAppGroupNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            // 1. Get configuration
            const to = this.config.to || this.config.recipients || this.config.phoneNumbers || '';
            const message = this.config.message || this.config.body || '';
            const groupName = this.config.groupName || '';
            const sendToGroup = this.config.sendToGroup === true;

            // 2. Validate Message
            if (!message) {
                return this.createErrorResult(
                    context,
                    startTime,
                    'No message specified. Please configure the "message" field.'
                );
            }

            // 3. Mode Selection & Execution

            // --- MODE A: WhatsApp Web (Groups) ---
            if (sendToGroup) {
                if (!groupName) {
                    return this.createErrorResult(
                        context,
                        startTime,
                        'Group Name is required when "Send to Group" is enabled.',
                        { hint: 'Enter the exact name of your WhatsApp group.' }
                    );
                }
                return await this.sendViaWhatsAppWeb(context, groupName, message, true, startTime);
            }

            // --- MODE B: Twilio (Individuals) ---
            if (to) {
                return await this.sendViaTwilio(context, to, message, groupName, startTime);
            }

            // --- Fallback / Configuration Error ---
            return {
                nodeId: context.context.runId,
                success: false,
                error: 'Configuration missing: No recipients or group specified.',
                output: {
                    hint: 'Either enable "Send to Group" and enter a group name, or add phone numbers to "Recipients".',
                    receivedConfig: { to, groupName, sendToGroup }
                },
                durationMs: Date.now() - startTime
            };

        } catch (error) {
            console.error('[WHATSAPP-GROUP] System Error:', error);
            return this.createErrorResult(
                context,
                startTime,
                error instanceof Error ? error.message : 'Unknown fatal error'
            );
        }
    }

    /**
     * Sends message using Local WhatsApp Web Service (No external API cost, supports Groups)
     */
    private async sendViaWhatsAppWeb(
        context: NodeExecutionContext,
        target: string, // Group Name or Number
        message: string,
        isGroup: boolean,
        startTime: number
    ): Promise<NodeResult> {
        try {
            console.log(`[WHATSAPP-WEB] Attempting to send to ${isGroup ? 'Group' : 'User'}: "${target}"`);

            // Allow dynamic import or Service retrieval ensures it runs in backend context
            const service = getWhatsAppWebService();

            // Check connection status
            if (!service.isConnected()) {
                return this.createErrorResult(
                    context,
                    startTime,
                    'WhatsApp Web is not connected.',
                    { hint: 'Go to Dashboard → Integration → WhatsApp Web to scan the QR Code.' }
                );
            }

            // If group, find ID by name
            let targetId = target;
            let groupMeta = null;

            if (isGroup) {
                const group = await service.findGroupByName(target);
                if (!group) {
                    return this.createErrorResult(
                        context,
                        startTime,
                        `Group "${target}" not found.`,
                        { hint: 'Check the group name spelling. Partial matches are allowed.' }
                    );
                }
                targetId = group.id;
                groupMeta = group;
            }

            // Send
            const result = await service.sendMessage(targetId, message, isGroup);

            if (result.success) {
                return {
                    nodeId: context.context.runId,
                    success: true,
                    output: {
                        method: 'whatsapp-web',
                        deliveredTo: groupMeta?.name || target,
                        isGroup,
                        messageId: result.messageId,
                        timestamp: new Date().toISOString()
                    },
                    durationMs: Date.now() - startTime
                };
            } else {
                return this.createErrorResult(
                    context,
                    startTime,
                    'WhatsApp Web failed to send message.',
                    { details: result.error }
                );
            }

        } catch (error) {
            return this.createErrorResult(
                context,
                startTime,
                `WhatsApp Web Service Error: ${error instanceof Error ? error.message : 'Unknown'}`
            );
        }
    }

    /**
     * Sends message using Twilio API (Official/Paid, Individuals Only)
     */
    private async sendViaTwilio(
        context: NodeExecutionContext,
        to: string,
        message: string,
        groupLabel: string,
        startTime: number
    ): Promise<NodeResult> {
        const recipients = typeof to === 'string'
            ? to.split(',').map((r: string) => r.trim()).filter(Boolean)
            : Array.isArray(to) ? to : [to];

        // Credentials
        const accountSid = context.services?.credentials?.accountSid || process.env.TWILIO_ACCOUNT_SID;
        const authToken = context.services?.credentials?.authToken || process.env.TWILIO_AUTH_TOKEN;
        let fromNumber = context.services?.credentials?.whatsappFrom || process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

        if (!fromNumber.startsWith('whatsapp:')) fromNumber = `whatsapp:${fromNumber}`;

        if (!accountSid || !authToken) {
            // Simulation Mode
            console.log('[WHATSAPP-GROUP] Twilio not configured. Simulating.');
            return {
                nodeId: context.context.runId,
                success: true,
                output: {
                    status: 'Simulation',
                    method: 'Twilio (Mock)',
                    recipients: recipients,
                    messagePreview: message.substring(0, 50),
                    note: 'Configure TWILIO_ACCOUNT_SID/TOKEN in .env for real sending.'
                },
                durationMs: Date.now() - startTime
            };
        }

        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const results = [];

        console.log(`[WHATSAPP-GROUP] Twilio Sending to ${recipients.length} recipients`);

        for (const recipient of recipients) {
            try {
                let cleanNumber = recipient.replace('whatsapp:', '').trim();
                // Ensure + prefix
                if (!cleanNumber.startsWith('+')) cleanNumber = `+${cleanNumber}`;

                const formattedTo = `whatsapp:${cleanNumber}`;

                const response = await fetch(
                    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            From: fromNumber,
                            To: formattedTo,
                            Body: message
                        })
                    }
                );

                const data = await response.json();
                results.push({
                    recipient: cleanNumber,
                    success: response.ok,
                    error: response.ok ? null : data.message
                });

            } catch (err) {
                results.push({ recipient, success: false, error: 'Network Error' });
            }
        }

        const failures = results.filter(r => !r.success);

        if (failures.length === recipients.length) {
            return this.createErrorResult(
                context,
                startTime,
                'All Twilio messages failed.',
                { errors: failures }
            );
        }

        return {
            nodeId: context.context.runId,
            success: true,
            output: {
                method: 'Twilio',
                total: recipients.length,
                sent: recipients.length - failures.length,
                failed: failures.length,
                groupLabel: groupLabel || 'N/A'
            },
            durationMs: Date.now() - startTime
        };
    }

    private createErrorResult(context: NodeExecutionContext, startTime: number, message: string, output: any = {}): NodeResult {
        return {
            nodeId: context.context.runId,
            success: false,
            error: message,
            output: output,
            durationMs: Date.now() - startTime
        };
    }

    validate(config: Record<string, any>): void {
        if (typeof config !== 'object') {
            throw new Error('WhatsApp Group requires configuration');
        }
    }
}