/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/workflow/nodes/DelayNode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class DelayNode extends BaseNode {
  validate(config: any): void {
    if (!config.duration) {
      throw new Error('Duration is required');
    }
    
    if (typeof config.duration !== 'number' || config.duration < 0) {
      throw new Error('Duration must be a positive number');
    }
    
    if (config.duration > 300) {
      throw new Error('Duration cannot exceed 300 seconds (5 minutes)');
    }
  }
  
  async execute(_: NodeExecutionContext): Promise<any> {
    const { duration } = this.config;
    
    try {
      // Convert seconds to milliseconds
      const delayMs = duration * 1000;
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return {
        delayed: true,
        duration,
        delayedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Delay failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}