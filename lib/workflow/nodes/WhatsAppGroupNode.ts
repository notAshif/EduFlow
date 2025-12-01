/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';

export class WhatsAppGroupNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            let { to, message, groupName } = this.config;

            if (process.env.NODE_ENV === 'development') {
                if (!to) {
                    console.warn('WhatsApp Group: No recipients specified, using default for dev');
                    to = '+1234567890';
                }
                if (!message) {
                    console.warn('WhatsApp Group: No message specified, using default for dev');
                    message = 'Debug test message from FlowX';
                }
            }

            if (!to || !message) {
                throw new Error('WhatsApp Group node requires "to" (phone numbers) and "message" fields');
            }

            const recipients = typeof to === 'string'
                ? to.split(',').map((r: string) => r.trim())
                : Array.isArray(to) ? to : [to];

            const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
            const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
            let twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER || 'whatsapp:+14155238886';
            if (!twilioWhatsAppFrom.startsWith('whatsapp:')) {
                twilioWhatsAppFrom = `whatsapp:${twilioWhatsAppFrom}`;
            }

            if (!twilioAccountSid || !twilioAuthToken) {
                console.warn('Twilio credentials not configured. Simulating WhatsApp send...');
                console.log(`[MOCK] WhatsApp Group: ${groupName || 'Default Group'}`);
                console.log(`[MOCK] Recipients: ${recipients.join(', ')}`);
                console.log(`[MOCK] Message: ${message}`);

                return {
                    nodeId: context.context.runId,
                    success: true,
                    output: {
                        status: 'simulated',
                        recipients,
                        message: message,
                        groupName,
                        timestamp: new Date().toISOString(),
                        note: 'Simulated - Twilio credentials not configured'
                    },
                    durationMs: Date.now() - startTime
                };
            }

            const results = [];
            for (const recipient of recipients) {
                try {
                    const formattedRecipient = recipient.startsWith('whatsapp:')
                        ? recipient
                        : `whatsapp:${recipient}`;

                    const response = await fetch(
                        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
                        {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                From: twilioWhatsAppFrom,
                                To: formattedRecipient,
                                Body: message
                            })
                        }
                    );

                    const data = await response.json();

                    results.push({
                        recipient,
                        success: response.ok,
                        sid: data.sid,
                        status: data.status,
                        error: !response.ok ? data.message : undefined
                    });
                } catch (error) {
                    results.push({
                        recipient,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }

            const allSuccessful = results.every(r => r.success);
            const successCount = results.filter(r => r.success).length;

            return {
                nodeId: context.context.runId,
                success: allSuccessful,
                output: {
                    results,
                    groupName,
                    totalRecipients: recipients.length,
                    successfulSends: successCount,
                    failedSends: recipients.length - successCount,
                    timestamp: new Date().toISOString()
                },
                error: allSuccessful ? undefined : `${recipients.length - successCount} message(s) failed to send`,
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                durationMs: Date.now() - startTime
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (process.env.NODE_ENV === 'development') {
            return;
        }

        if (!config.to) {
            throw new Error('WhatsApp Group node requires "to" field (comma-separated phone numbers)');
        }
        if (!config.message) {
            throw new Error('WhatsApp Group node requires "message" field');
        }
    }
}