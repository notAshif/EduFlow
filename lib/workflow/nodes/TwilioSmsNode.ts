/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';

export class TwilioSmsNode extends BaseNode {
  validate() { }

  async execute(ctx: NodeExecutionContext): Promise<NodeResult> {
    return {
      nodeId: ctx.context.runId,
      success: false,
      error: 'Twilio SMS node has been deprecated and and Twilio services removed from this project. Please use the "WhatsApp Messenger" node for communication.',
      durationMs: 0
    };
  }
}