/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class DiscordSendNode extends BaseNode {
  validate(config: any): void {
    if (!config.webhookUrl) throw new Error('Discord webhook URL is required');
    if (!config.message) throw new Error('Message is required');
    if (!config.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new Error('Invalid Discord webhook URL format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const { webhookUrl, message, username = 'FlowX Bot', avatar_url } = this.config;
    const startTime = Date.now();

    console.log('[DISCORD] Starting execution');
    console.log('[DISCORD] Webhook:', webhookUrl.substring(0, 50) + '...');
    console.log('[DISCORD] Message:', message);
    console.log('[DISCORD] Username:', username);

    try {
      const payload = {
        content: message,
        username,
        avatar_url,
      };

      console.log('[DISCORD] Sending to webhook...');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('[DISCORD] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DISCORD] ✗ Failed:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
        }

        throw new Error(`Discord API error: ${errorData.message || errorText}`);
      }

      // Discord webhooks return 204 No Content on success
      console.log('[DISCORD] ✓ Success!');

      return {
        success: true,
        message,
        username,
        status: 'sent',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[DISCORD] ✗ Exception:', error);
      throw new Error(
        `Discord send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}