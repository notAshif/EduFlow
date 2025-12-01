/* eslint-disable @typescript-eslint/no-explicit-any */
import { NodeExecutionContext } from '@/lib/types';

export abstract class BaseNode {
  protected config: Record<string, any>;
  
  constructor(config: Record<string, any> = {}) {
    this.config = config;
  }
  
  abstract validate(config: any): void;
  abstract execute(context: NodeExecutionContext): Promise<any>;
  
  updateConfig(newConfig: Record<string, any>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  getConfig(): Record<string, any> {
    return this.config;
  }
}