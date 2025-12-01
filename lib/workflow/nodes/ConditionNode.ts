/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/workflow/nodes/ConditionNode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class ConditionNode extends BaseNode {
  validate(config: any): void {
    if (!config.field) {
      throw new Error('Field is required');
    }

    if (!config.operator) {
      throw new Error('Operator is required');
    }

    if (!['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'exists', 'not_exists'].includes(config.operator)) {
      throw new Error('Invalid operator');
    }
  }

  async execute({ input }: NodeExecutionContext): Promise<any> {
    const { field, operator, value } = this.config;

    try {
      const fieldValue = this.getNestedValue(input, field);

      let result = false;

      switch (operator) {
        case 'equals':
          result = fieldValue === value;
          break;
        case 'not_equals':
          result = fieldValue !== value;
          break;
        case 'contains':
          result = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'not_contains':
          result = !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'greater_than':
          result = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          result = Number(fieldValue) < Number(value);
          break;
        case 'exists':
          result = fieldValue !== undefined && fieldValue !== null;
          break;
        case 'not_exists':
          result = fieldValue === undefined || fieldValue === null;
          break;
      }

      return {
        condition: {
          field,
          operator,
          value,
          result,
        },
        passed: result,
        fieldValue,
      };
    } catch (error) {
      throw new Error(`Condition evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    if (!path) return undefined;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
