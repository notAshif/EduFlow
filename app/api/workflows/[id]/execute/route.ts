import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { WorkflowExecutor } from '@/lib/workflow/executor';
import { z } from 'zod';

const executeSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const { payload } = executeSchema.parse(body);

    const executor = new WorkflowExecutor();
    const runId = await executor.execute(id, payload);

    return NextResponse.json(
      { ok: true, data: { runId } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error executing workflow:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}