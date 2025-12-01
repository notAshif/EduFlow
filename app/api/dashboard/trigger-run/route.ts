import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { emitDashboardEvent } from '@/lib/realtime';

export async function POST(request: NextRequest) {
    try {
        if (process.env.NODE_ENV === 'production' && process.env.DEV_REALTIME !== 'true') {
            return NextResponse.json(
                { ok: false, error: 'This endpoint is only available in development' },
                { status: 403 }
            );
        }

        const user = await requireAuth();
        const body = await request.json();
        const { workflowId, status = 'SUCCESS' } = body;

        let workflow = workflowId
            ? await prisma.workflow.findUnique({ where: { id: workflowId } })
            : await prisma.workflow.findFirst({ where: { organizationId: user.organizationId } });

        if (!workflow) {
            workflow = await prisma.workflow.create({
                data: {
                    name: 'Demo Workflow',
                    organizationId: user.organizationId,
                    nodes: [],
                    edges: [],
                    enabled: true,
                },
            });
        }

        const run = await prisma.workflowRun.create({
            data: {
                workflowId: workflow.id,
                organizationId: user.organizationId,
                status: 'RUNNING',
                startedAt: new Date(),
            },
        });

        setTimeout(async () => {
            const finishedRun = await prisma.workflowRun.update({
                where: { id: run.id },
                data: {
                    status: status,
                    finishedAt: new Date(),
                },
                include: {
                    workflow: {
                        select: { name: true },
                    },
                },
            });

            emitDashboardEvent({
                type: 'new-run',
                data: {
                    id: finishedRun.id,
                    workflowId: finishedRun.workflowId,
                    workflowName: finishedRun.workflow.name,
                    status: finishedRun.status,
                    startedAt: finishedRun.startedAt.toISOString(),
                    finishedAt: finishedRun.finishedAt?.toISOString(),
                    duration: finishedRun.finishedAt
                        ? finishedRun.finishedAt.getTime() - finishedRun.startedAt.getTime()
                        : null,
                },
            });

            const totalRuns = await prisma.workflowRun.count({
                where: { organizationId: user.organizationId },
            });

            const successfulRuns = await prisma.workflowRun.count({
                where: { organizationId: user.organizationId, status: 'SUCCESS' },
            });

            const successRate = totalRuns > 0
                ? Math.round((successfulRuns / totalRuns) * 100 * 10) / 10
                : 0;

            emitDashboardEvent({
                type: 'stats-update',
                data: {
                    totalRuns,
                    successRate,
                },
            });
        }, 2000);

        return NextResponse.json({
            ok: true,
            data: {
                runId: run.id,
                workflowId: workflow.id,
                message: 'Workflow run triggered successfully',
            },
        });
    } catch (error) {
        console.error('Error triggering workflow run:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json(
                { ok: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { ok: false, error: 'Failed to trigger workflow run' },
            { status: 500 }
        );
    }
}