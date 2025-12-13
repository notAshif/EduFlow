/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class DiscordSendNode extends BaseNode {
  validate(config: any): void {
    // Webhook URL can come from config OR from integration credentials
    // So we don't require it in validation if it might come from credentials
    if (!config.message) throw new Error('Message is required');

    // Only validate webhook URL format if provided in config
    if (config.webhookUrl && !config.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new Error('Invalid Discord webhook URL format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const { message, username = 'EduFlow Bot', avatar_url } = this.config;
    const startTime = Date.now();

    console.log('[DISCORD] Starting execution');

    // Priority: config > credentials from integration
    let webhookUrl = this.config.webhookUrl;

    // If no webhook URL in config, try to get from integration credentials
    if (!webhookUrl && context.services?.credentials) {
      webhookUrl = context.services.credentials.webhookUrl;
      console.log('[DISCORD] Using webhook URL from integration credentials');
    }

    // Fallback to environment variable
    if (!webhookUrl) {
      webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        console.log('[DISCORD] Using webhook URL from environment variable');
      }
    }

    if (!webhookUrl) {
      throw new Error('Discord webhook URL is required. Configure it in the node settings, integration page, or set DISCORD_WEBHOOK_URL environment variable.');
    }

    console.log('[DISCORD] Webhook: ...', webhookUrl.substring(webhookUrl.length - 20));
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
        } catch {
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