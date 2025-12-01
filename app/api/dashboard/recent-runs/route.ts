import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAuth();
        const organizationId = user.organizationId;

        const recentRuns = await prisma.workflowRun.findMany({
            where: { organizationId },
            include: {
                workflow: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
            take: 10,
        });

        const formattedRuns = recentRuns.map(run => ({
            id: run.id,
            workflowId: run.workflowId,
            workflowName: run.workflow.name,
            status: run.status,
            startedAt: run.startedAt.toISOString(),
            finishedAt: run.finishedAt?.toISOString() || null,
            duration: run.finishedAt
                ? run.finishedAt.getTime() - run.startedAt.getTime()
                : null,
        }));

        return NextResponse.json({
            ok: true,
            data: formattedRuns,
        });
    } catch (error) {
        console.error('Error fetching recent runs:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { ok: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { ok: false, error: 'Failed to fetch recent runs' },
            { status: 500 }
        );
    }
}