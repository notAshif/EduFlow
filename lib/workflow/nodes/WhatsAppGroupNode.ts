/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { getWhatsAppWebService } from '@/lib/services/whatsapp-web';

export class WhatsAppGroupNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            // 1. Get configuration
            const targetId = this.config.whatsappChatId || this.config.targetId || this.config.to || '';
            const message = this.config.message || this.config.body || '';
            const isGroup = this.config.isGroup !== false; // Default to true for this node type, but allow override

            // 2. Validate Message
            if (!message) {
                return this.createErrorResult(
                    context,
                    startTime,
                    'No message specified. Please configure the "message" field.'
                );
            }

            if (!targetId) {
                return this.createErrorResult(
                    context,
                    startTime,
                    'No recipient selected. Please select a chat or group from the list.'
                );
            }

            // 3. Execution - Pure WhatsApp Web
            console.log(`[WHATSAPP-NODE] Attempting to send to: "${targetId}"`);

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

            // Send
            // The service handles formatting if it's a number (adds @c.us) or group (adds @g.us)
            // But usually we pass the full serialized ID like "1234@c.us" or "5678@g.us"
            const result = await service.sendMessage(targetId, message, targetId.includes('@g.us'));

            if (result.success) {
                return {
                    nodeId: context.context.runId,
                    success: true,
                    output: {
                        method: 'whatsapp-web',
                        deliveredTo: targetId,
                        isGroup: targetId.includes('@g.us'),
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
            console.error('[WHATSAPP-NODE] System Error:', error);
            return this.createErrorResult(
                context,
                startTime,
                error instanceof Error ? error.message : 'Unknown fatal error'
            );
        }
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
            throw new Error('WhatsApp Node requires configuration');
        }
    }
}