import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { broadcaster } from '@/lib/realtime';

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required'),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
  enabled: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const workflows = await prisma.workflow.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        runs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
    });

    const workflowsWithCount = workflows.map(wf => ({
      ...wf,
      runCount: wf._count.runs,
      lastRun: wf.runs[0] ? {
        status: wf.runs[0].status,
        startedAt: wf.runs[0].startedAt.toISOString(),
        duration: wf.runs[0].finishedAt 
          ? wf.runs[0].finishedAt.getTime() - wf.runs[0].startedAt.getTime()
          : null,
      } : undefined,
    }));

    return NextResponse.json({
      ok: true,
      data: workflowsWithCount,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { name, nodes, edges, enabled } = createWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.create({
      data: {
        name,
        nodes,
        edges,
        enabled,
        organizationId: user.organizationId,
      },
    });

    broadcaster.broadcast('dashboard', {
      type: 'workflow-created',
      data: {
        id: workflow.id,
        name: workflow.name,
        enabled: workflow.enabled,
        createdAt: workflow.createdAt.toISOString(),
        runCount: 0,
      },
    });

    const totalWorkflows = await prisma.workflow.count({
      where: { organizationId: user.organizationId },
    });

    const activeWorkflows = await prisma.workflow.count({
      where: { organizationId: user.organizationId, enabled: true },
    });

    broadcaster.broadcast('dashboard', {
      type: 'stats-update',
      data: {
        totalWorkflows,
        activeWorkflows,
      },
    });

    return NextResponse.json({
      ok: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error creating workflow:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}