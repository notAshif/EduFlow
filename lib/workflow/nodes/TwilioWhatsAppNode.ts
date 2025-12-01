/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class TwilioWhatsAppNode extends BaseNode {
  validate(config: any): void {
    if (!config.to) throw new Error('WhatsApp number (to) is required');
    if (!config.message) throw new Error('Message is required');
    if (!/^[\d\s\-\+\(\)]+$/.test(config.to)) {
      throw new Error('Invalid WhatsApp number format');
    }
  }

  async execute(ctx: NodeExecutionContext): Promise<any> {
    const { to, message, from } = this.config;
    const credentials = ctx?.services?.credentials as any | undefined;

    if (!credentials || !credentials.accountSid || !credentials.authToken) {
      return {
        mock: true,
        preview: `Would send WhatsApp message to ${to}: ${message}`,
        to,
        body: message,
        timestamp: new Date().toISOString(),
      };
    }

    try {
      return {
        success: true,
        sid: `MOCK_WHATSAPP_${Date.now()}`,
        to: `whatsapp:${to}`,
        from: `whatsapp:${from || credentials.fromNumber}`,
        body: message,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Twilio WhatsApp failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}