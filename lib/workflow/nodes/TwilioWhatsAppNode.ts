/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';

export class TwilioWhatsAppNode extends BaseNode {
  validate() { }

  async execute(ctx: NodeExecutionContext): Promise<NodeResult> {
    return {
      nodeId: ctx.context.runId,
      success: false,
      error: 'Twilio WhatsApp node has been deprecated and Twilio services removed from this project. Please use the "WhatsApp Messenger" node which now supports both contacts and groups via WhatsApp Web.',
      durationMs: 0
    };
  }
}