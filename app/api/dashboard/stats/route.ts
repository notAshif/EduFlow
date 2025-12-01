import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAuth();
        const organizationId = user.organizationId;

        const totalWorkflows = await prisma.workflow.count({
            where: { organizationId },
        });

        const activeWorkflows = await prisma.workflow.count({
            where: { organizationId, enabled: true },
        });

        const totalRuns = await prisma.workflowRun.count({
            where: { organizationId },
        });

        const successfulRuns = await prisma.workflowRun.count({
            where: {
                organizationId,
                status: 'SUCCESS',
            },
        });

        const successRate = totalRuns > 0
            ? Math.round((successfulRuns / totalRuns) * 100 * 10) / 10
            : 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await prisma.user.count({
            where: {
                organizationId,
                OR: [
                    {
                        createdAssignments: {
                            some: {
                                createdAt: {
                                    gte: thirtyDaysAgo,
                                },
                            },
                        },
                    },
                    {
                        recordedAttendance: {
                            some: {
                                createdAt: {
                                    gte: thirtyDaysAgo,
                                },
                            },
                        },
                    },
                    {
                        updatedAt: {
                            gte: thirtyDaysAgo,
                        },
                    },
                ],
            },
        });

        return NextResponse.json({
            ok: true,
            data: {
                totalWorkflows,
                activeWorkflows,
                totalRuns,
                successRate,
                activeUsers,
            },
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { ok: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { ok: false, error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}