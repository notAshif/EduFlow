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

    const validOperators = [
      'equals', 'not_equals', 'not-equals',
      'contains', 'not_contains', 'not-contains',
      'greater_than', 'greater-than', 'greater',
      'less_than', 'less-than', 'less',
      'exists', 'not_exists', 'not-exists'
    ];

    if (!validOperators.includes(config.operator)) {
      throw new Error(`Invalid operator: ${config.operator}`);
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
        case 'not-equals':
          result = fieldValue !== value;
          break;
        case 'contains':
          result = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'not_contains':
        case 'not-contains':
          result = !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'greater_than':
        case 'greater-than':
        case 'greater':
          result = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
        case 'less-than':
        case 'less':
          result = Number(fieldValue) < Number(value);
          break;
        case 'exists':
          result = fieldValue !== undefined && fieldValue !== null;
          break;
        case 'not_exists':
        case 'not-exists':
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
