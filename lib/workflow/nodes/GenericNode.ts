/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

/**
 * GenericNode - A flexible node that can handle any node type
 * Used for nodes that don't have a specific implementation yet
 * Returns configurable output for testing and development
 */
export class GenericNode extends BaseNode {
    private nodeType: string;
    private nodeLabel: string;
    private resultMessage: string;
    private resultData: Record<string, any>;

    constructor(
        config: Record<string, any>,
        nodeType: string,
        nodeLabel: string,
        resultMessage: string,
        resultData: Record<string, any> = {}
    ) {
        super(config);
        this.nodeType = nodeType;
        this.nodeLabel = nodeLabel;
        this.resultMessage = resultMessage;
        this.resultData = resultData;
    }

    validate(_config: Record<string, any>): void {
        // Generic nodes are always valid - actual validation would depend on the specific type
        // For production, you'd want to add specific validation per node type
    }

    async execute(context: NodeExecutionContext): Promise<any> {
        const { input, context: ctx } = context;

        console.log(`[GenericNode:${this.nodeType}] Executing ${this.nodeLabel}`);
        console.log(`[GenericNode:${this.nodeType}] Config:`, this.config);
        console.log(`[GenericNode:${this.nodeType}] Input:`, input);

        // Simulate some processing time for realism
        await new Promise(resolve => setTimeout(resolve, 100));

        // Build the result
        const result = {
            success: true,
            nodeType: this.nodeType,
            label: this.nodeLabel,
            message: this.resultMessage,
            timestamp: new Date().toISOString(),
            config: this.config,
            context: {
                workflowId: ctx.workflowId,
                runId: ctx.runId,
            },
            input: input,
            output: {
                ...this.resultData,
                processed: true,
            }
        };

        // Handle specific node types with custom logic
        switch (this.nodeType) {
            case 'trigger-schedule':
                return {
                    ...result,
                    output: {
                        triggered: true,
                        scheduledTime: this.config.scheduledTime || new Date().toISOString(),
                        cronExpression: this.config.cronExpression || '* * * * *',
                        nextRun: new Date(Date.now() + 60000).toISOString(),
                    }
                };

            case 'trigger-webhook':
                return {
                    ...result,
                    output: {
                        triggered: true,
                        webhookId: this.config.webhookId || `wh_${Date.now()}`,
                        method: input?.method || 'POST',
                        payload: input?.body || {},
                    }
                };

            case 'google-classroom':
                return {
                    ...result,
                    output: {
                        action: this.config.action || 'list_courses',
                        courseId: this.config.courseId,
                        courses: [
                            { id: 'course_1', name: 'Mathematics 101', enrollment: 32 },
                            { id: 'course_2', name: 'Physics 201', enrollment: 28 },
                        ],
                        success: true,
                    }
                };

            case 'google-sheets':
                return {
                    ...result,
                    output: {
                        spreadsheetId: this.config.spreadsheetId,
                        range: this.config.range || 'A1:Z100',
                        action: this.config.action || 'read',
                        rowsAffected: 10,
                        data: input?.data || [],
                    }
                };

            case 'google-calendar':
                return {
                    ...result,
                    output: {
                        calendarId: this.config.calendarId || 'primary',
                        action: this.config.action || 'list_events',
                        events: [
                            { id: 'evt_1', title: 'Class - Math', start: '09:00', end: '10:00' },
                            { id: 'evt_2', title: 'Meeting', start: '14:00', end: '15:00' },
                        ],
                    }
                };

            case 'zoom-meeting':
                return {
                    ...result,
                    output: {
                        meetingId: `zm_${Date.now()}`,
                        topic: this.config.topic || 'Scheduled Meeting',
                        startTime: this.config.startTime || new Date().toISOString(),
                        duration: this.config.duration || 60,
                        joinUrl: `https://zoom.us/j/${Date.now()}`,
                        password: Math.random().toString(36).substring(7),
                    }
                };

            case 'grade-calculate':
                return {
                    ...result,
                    output: {
                        formula: this.config.formula || 'weighted_average',
                        inputScores: this.config.scores || [],
                        calculatedGrade: 85.5,
                        letterGrade: 'B+',
                        passed: true,
                    }
                };

            case 'ai-summarize':
                return {
                    ...result,
                    output: {
                        originalLength: this.config.text?.length || input?.text?.length || 0,
                        summary: 'This is an AI-generated summary of the provided content.',
                        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
                        sentiment: 'neutral',
                    }
                };

            case 'loop':
                const items = this.config.items || input?.items || [];
                return {
                    ...result,
                    output: {
                        iterations: items.length,
                        items: items,
                        processed: items.map((item: any, i: number) => ({ index: i, item, processed: true })),
                    }
                };

            case 'filter':
                const data = input?.data || [];
                return {
                    ...result,
                    output: {
                        originalCount: data.length,
                        filteredCount: Math.floor(data.length * 0.7),
                        condition: this.config.condition,
                        filtered: data.slice(0, Math.floor(data.length * 0.7)),
                    }
                };

            case 'condition':
                const conditionValue = this.config.value || input?.value;
                const operator = this.config.operator || 'equals';
                const compareValue = this.config.compareValue;
                let conditionMet = false;

                switch (operator) {
                    case 'equals': conditionMet = conditionValue == compareValue; break;
                    case 'not_equals': conditionMet = conditionValue != compareValue; break;
                    case 'greater': conditionMet = conditionValue > compareValue; break;
                    case 'less': conditionMet = conditionValue < compareValue; break;
                    case 'contains': conditionMet = String(conditionValue).includes(String(compareValue)); break;
                    default: conditionMet = Boolean(conditionValue);
                }

                return {
                    ...result,
                    output: {
                        conditionMet,
                        operator,
                        leftValue: conditionValue,
                        rightValue: compareValue,
                        branch: conditionMet ? 'true' : 'false',
                    }
                };

            case 'delay':
                const delayMs = (this.config.seconds || 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 5000))); // Cap at 5s
                return {
                    ...result,
                    output: {
                        delayed: true,
                        delaySeconds: this.config.seconds || 1,
                        actualDelayMs: Math.min(delayMs, 5000),
                    }
                };

            default:
                return result;
        }
    }
}
