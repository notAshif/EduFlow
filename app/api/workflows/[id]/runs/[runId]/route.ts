import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, runId } = await params;

    const run = await prisma.workflowRun.findFirst({
      where: {
        id: runId,
        workflowId: id,
        organizationId: user.organizationId,
      },
    });

    if (!run) {
      return NextResponse.json(
        { ok: false, error: 'Workflow run not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: run,
    });
  } catch (error) {
    console.error('Error fetching workflow run:', error);

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