// lib/workflow/nodes/ScheduleCheckNode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { prisma } from '@/lib/db';

export class ScheduleCheckNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();
        const orgId = context.context.organizationId;

        try {
            const { classId, teacherId, date, reminderMinutes } = this.config;

            // Fetch actual schedule from database
            const targetDate = date ? new Date(date) : new Date();
            const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 1 is Monday...

            const whereClause: any = {
                organizationId: orgId,
                dayOfWeek: dayOfWeek
            };

            if (classId) whereClause.classId = classId;
            if (teacherId) whereClause.teacherId = teacherId;

            const schedules = await prisma.classSchedule.findMany({
                where: whereClause,
                orderBy: { startTime: 'asc' }
            });

            console.log(`[SCHEDULE] Checking schedule for day: ${dayOfWeek}, Org: ${orgId}`);
            console.log(`[SCHEDULE] Found ${schedules.length} classes`);

            const upcomingClasses = schedules.map(s => ({
                id: s.id,
                subject: s.subject,
                time: `${s.startTime} - ${s.endTime}`,
                room: 'N/A', // Room not in schema yet
                teacher: s.teacherId || 'N/A'
            }));

            return {
                nodeId: context.context.runId,
                success: true,
                output: {
                    date: targetDate.toISOString().split('T')[0],
                    dayOfWeek,
                    upcomingClasses,
                    count: upcomingClasses.length,
                    reminderMinutes: reminderMinutes || 15,
                    classId,
                    teacherId,
                    timestamp: new Date().toISOString()
                },
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            console.error('[SCHEDULE] Check failed:', error);
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                durationMs: Date.now() - startTime
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (config.reminderMinutes && config.reminderMinutes < 0) {
            throw new Error('Reminder minutes must be positive');
        }
    }
}
