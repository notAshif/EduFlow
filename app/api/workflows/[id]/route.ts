import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        runs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json(
        { ok: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: workflow,
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const updateData = updateWorkflowSchema.parse(body);

    const workflow = await prisma.workflow.updateMany({
      where: {
        id,
        organizationId: user.organizationId,
      },
      data: updateData,
    });

    if (workflow.count === 0) {
      return NextResponse.json(
        { ok: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const updatedWorkflow = await prisma.workflow.findUnique({
      where: { id },
    });

    return NextResponse.json({
      ok: true,
      data: updatedWorkflow,
    });
  } catch (error) {
    console.error('Error updating workflow:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
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
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const workflow = await prisma.workflow.deleteMany({
      where: {
        id,
        organizationId: user.organizationId,
      },
    });

    if (workflow.count === 0) {
      return NextResponse.json(
        { ok: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}