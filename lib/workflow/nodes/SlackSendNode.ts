/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class SlackSendNode extends BaseNode {
  validate(config: any): void {
    // Webhook URL can come from config OR from integration credentials
    if (!config.message) throw new Error('Message is required');

    // Only validate webhook URL format if provided in config
    if (config.webhookUrl && !config.webhookUrl.startsWith('https://hooks.slack.com/')) {
      throw new Error('Invalid Slack webhook URL format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const {
      message,
      channel,
      username = 'EduFlow Bot',
      icon_emoji = ':robot_face:',
    } = this.config;
    const startTime = Date.now();

    console.log('[SLACK] Starting execution');

    // Priority: config > credentials from integration
    let webhookUrl = this.config.webhookUrl;

    // If no webhook URL in config, try to get from integration credentials
    if (!webhookUrl && context.services?.credentials) {
      webhookUrl = context.services.credentials.webhookUrl;
      console.log('[SLACK] Using webhook URL from integration credentials');
    }

    // Fallback to environment variable
    if (!webhookUrl) {
      webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (webhookUrl) {
        console.log('[SLACK] Using webhook URL from environment variable');
      }
    }

    if (!webhookUrl) {
      throw new Error('Slack webhook URL is required. Configure it in the node settings, integration page, or set SLACK_WEBHOOK_URL environment variable.');
    }

    console.log('[SLACK] Webhook: ...', webhookUrl.substring(webhookUrl.length - 20));
    console.log('[SLACK] Message:', message);
    console.log('[SLACK] Channel:', channel || 'default');

    try {
      const payload = {
        text: message,
        channel,
        username,
        icon_emoji,
      };

      console.log('[SLACK] Sending to webhook...');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('[SLACK] Response status:', response.status);
      console.log('[SLACK] Response:', responseText);

      if (!response.ok) {
        console.error('[SLACK] ✗ Failed:', responseText);
        throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
      }

      if (responseText !== 'ok') {
        console.error('[SLACK] ✗ Unexpected response:', responseText);
        throw new Error(`Slack returned unexpected response: ${responseText}`);
      }

      console.log('[SLACK] ✓ Success!');

      return {
        success: true,
        message,
        channel,
        status: 'sent',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[SLACK] ✗ Exception:', error);
      throw new Error(
        `Slack send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}