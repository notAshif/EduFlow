// app/api/workflows/[id]/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

type RouteParams = Promise<{ id: string }>;

// GET - Get scheduled runs for a workflow
export async function GET(
    request: NextRequest,
    { params }: { params: RouteParams }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const scheduledWorkflows = await prisma.scheduledWorkflow.findMany({
            where: {
                workflowId: id,
                organizationId: user.organizationId,
            },
            orderBy: { scheduledAt: 'desc' },
            take: 20,
        });

        return NextResponse.json({
            ok: true,
            data: scheduledWorkflows,
        });
    } catch (error) {
        console.error('[SCHEDULE_GET] Error:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to get schedules' },
            { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
        );
    }
}

// POST - Schedule a workflow to run at a specific time
export async function POST(
    request: NextRequest,
    { params }: { params: RouteParams }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const body = await request.json();
        const { scheduledAt, payload } = body;

        if (!scheduledAt) {
            return NextResponse.json(
                { ok: false, error: 'scheduledAt is required' },
                { status: 400 }
            );
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json(
                { ok: false, error: 'Invalid scheduledAt date format' },
                { status: 400 }
            );
        }

        if (scheduledDate <= new Date()) {
            return NextResponse.json(
                { ok: false, error: 'Scheduled time must be in the future' },
                { status: 400 }
            );
        }

        // Verify workflow exists and belongs to user's organization
        const workflow = await prisma.workflow.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });

        if (!workflow) {
            return NextResponse.json(
                { ok: false, error: 'Workflow not found' },
                { status: 404 }
            );
        }

        const scheduled = await prisma.scheduledWorkflow.create({
            data: {
                workflowId: id,
                scheduledAt: scheduledDate,
                payload: payload || null,
                organizationId: user.organizationId,
                status: 'PENDING',
            },
        });

        return NextResponse.json({
            ok: true,
            data: scheduled,
            message: `Workflow scheduled for ${scheduledDate.toLocaleString()}`,
        });
    } catch (error) {
        console.error('[SCHEDULE_POST] Error:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to schedule workflow' },
            { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
        );
    }
}

// DELETE - Cancel a scheduled workflow
export async function DELETE(
    request: NextRequest,
    { params }: { params: RouteParams }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const scheduleId = searchParams.get('scheduleId');

        if (!scheduleId) {
            return NextResponse.json(
                { ok: false, error: 'scheduleId query parameter is required' },
                { status: 400 }
            );
        }

        // Verify schedule exists and belongs to user's organization
        const schedule = await prisma.scheduledWorkflow.findFirst({
            where: {
                id: scheduleId,
                workflowId: id,
                organizationId: user.organizationId,
                status: 'PENDING',
            },
        });

        if (!schedule) {
            return NextResponse.json(
                { ok: false, error: 'Scheduled workflow not found or already executed' },
                { status: 404 }
            );
        }

        await prisma.scheduledWorkflow.update({
            where: { id: scheduleId },
            data: { status: 'CANCELLED' },
        });

        return NextResponse.json({
            ok: true,
            message: 'Scheduled workflow cancelled',
        });
    } catch (error) {
        console.error('[SCHEDULE_DELETE] Error:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to cancel scheduled workflow' },
            { status: error instanceof Error && error.message === 'Authentication required' ? 401 : 500 }
        );
    }
}
