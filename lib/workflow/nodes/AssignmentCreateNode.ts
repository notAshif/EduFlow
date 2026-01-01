// lib/workflow/nodes/AssignmentCreateNode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { prisma } from '@/lib/db';

export class AssignmentCreateNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();
        const { input } = context;
        const orgId = context.context.organizationId;
        const clerkId = context.context.userId;

        try {
            // Priority: Input > Config
            const title = input?.title || input?.assignmentTitle || this.config.title;
            const description = input?.description || this.config.description;
            const dueDateStr = input?.dueDate || input?.date || this.config.dueDate;
            const classId = input?.classId || this.config.classId;
            const notifyStudents = input?.notifyStudents ?? this.config.notifyStudents ?? false;

            if (!title) {
                throw new Error('Assignment requires a "title" (provide in config or input)');
            }

            // Resolve User for createdByUserId
            let dbUserId: string | undefined;
            if (clerkId) {
                const user = await prisma.user.findUnique({ where: { clerkId } });
                dbUserId = user?.id;
            }

            if (!dbUserId) {
                // Fallback: use the first administrator/teacher in the organization
                const firstUser = await prisma.user.findFirst({ where: { organizationId: orgId } });
                dbUserId = firstUser?.id;
            }

            if (!dbUserId) {
                throw new Error('Could not find a valid user in this organization to create the assignment.');
            }

            // Create assignment in database
            const assignment = await prisma.assignment.create({
                data: {
                    title,
                    description,
                    dueDate: dueDateStr ? new Date(dueDateStr) : null,
                    organizationId: orgId,
                    createdByUserId: dbUserId,
                    // attachments: input?.attachments || this.config.attachments || []
                }
            });

            console.log(`[ASSIGNMENT] Created in DB: ${assignment.id} - ${title}`);

            return {
                nodeId: context.context.runId,
                success: true,
                output: {
                    assignmentId: assignment.id,
                    title: assignment.title,
                    description: assignment.description,
                    dueDate: assignment.dueDate,
                    createdAt: assignment.createdAt,
                    status: 'created'
                },
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            console.error('[ASSIGNMENT] Create failed:', error);
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                durationMs: Date.now() - startTime
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (!config.title && !config.useDynamicTitle) {
            // Optional warning if needed
        }
    }
}
