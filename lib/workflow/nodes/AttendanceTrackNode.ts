// lib/workflow/nodes/AttendanceTrackNode.ts
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { prisma } from '@/lib/db';

export class AttendanceTrackNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();
        const orgId = context.context.organizationId;

        try {
            const { studentId, classId, threshold, action } = this.config;

            // Fetch actual attendance records from database
            const whereClause: any = {
                organizationId: orgId,
            };

            if (studentId) whereClause.studentId = studentId;
            // Note: Attendance model in schema.prisma doesn't have classId directly, 
            // but we could filter or extend it. For now we use studentId.

            const attendanceRecords = await prisma.attendance.findMany({
                where: whereClause
            });

            if (attendanceRecords.length === 0) {
                return {
                    nodeId: context.context.runId,
                    success: true,
                    output: {
                        studentId,
                        classId,
                        attendancePercentage: 0,
                        totalRecords: 0,
                        message: 'No attendance records found for this student.',
                        belowThreshold: false
                    },
                    durationMs: Date.now() - startTime
                };
            }

            const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
            const actualAttendancePercentage = (presentCount / attendanceRecords.length) * 100;

            const thresholdValue = threshold || 75;
            const belowThreshold = actualAttendancePercentage < thresholdValue;

            console.log(`[ATTENDANCE] Student: ${studentId || 'All'}, Records: ${attendanceRecords.length}`);
            console.log(`[ATTENDANCE] Current: ${actualAttendancePercentage.toFixed(2)}%, Threshold: ${thresholdValue}%`);

            if (belowThreshold && action) {
                console.log(`[ATTENDANCE] Below threshold! Action: ${action}`);
            }

            return {
                nodeId: context.context.runId,
                success: true,
                output: {
                    studentId,
                    classId,
                    attendancePercentage: actualAttendancePercentage,
                    threshold: thresholdValue,
                    belowThreshold,
                    action: belowThreshold ? action : null,
                    totalRecords: attendanceRecords.length,
                    timestamp: new Date().toISOString()
                },
                durationMs: Date.now() - startTime
            };
        } catch (error) {
            console.error('[ATTENDANCE] Track failed:', error);
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                durationMs: Date.now() - startTime
            };
        }
    }

    validate(config: Record<string, any>): void {
        if (config.threshold && (config.threshold < 0 || config.threshold > 100)) {
            throw new Error('Attendance threshold must be between 0 and 100');
        }
    }
}
