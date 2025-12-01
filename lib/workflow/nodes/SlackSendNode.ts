/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class SlackSendNode extends BaseNode {
  validate(config: any): void {
    if (!config.webhookUrl) throw new Error('Slack webhook URL is required');
    if (!config.message) throw new Error('Message is required');
    if (!config.webhookUrl.startsWith('https://hooks.slack.com/')) {
      throw new Error('Invalid Slack webhook URL format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const {
      webhookUrl,
      message,
      channel,
      username = 'FlowX Bot',
      icon_emoji = ':robot_face:',
    } = this.config;
    const startTime = Date.now();

    console.log('[SLACK] Starting execution');
    console.log('[SLACK] Webhook:', webhookUrl.substring(0, 50) + '...');
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