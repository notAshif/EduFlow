import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { broadcaster } from '@/lib/realtime';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        // Fetch the original workflow
        const originalWorkflow = await prisma.workflow.findFirst({
            where: {
                id,
                organizationId: user.organizationId,
            },
        });

        if (!originalWorkflow) {
            return NextResponse.json(
                { ok: false, error: 'Workflow not found' },
                { status: 404 }
            );
        }

        // Create the duplicate
        const duplicatedWorkflow = await prisma.workflow.create({
            data: {
                name: `${originalWorkflow.name} (Copy)`,
                nodes: originalWorkflow.nodes as any,
                edges: originalWorkflow.edges as any,
                enabled: false, // Default duplicated workflows to inactive
                organizationId: user.organizationId,
            },
        });

        // Broadcast the creation event
        broadcaster.broadcast('dashboard', {
            type: 'workflow-created',
            data: {
                id: duplicatedWorkflow.id,
                name: duplicatedWorkflow.name,
                enabled: duplicatedWorkflow.enabled,
                createdAt: duplicatedWorkflow.createdAt.toISOString(),
                runCount: 0,
            },
        });

        return NextResponse.json({
            ok: true,
            data: duplicatedWorkflow,
        });
    } catch (error) {
        console.error('Error duplicating workflow:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
