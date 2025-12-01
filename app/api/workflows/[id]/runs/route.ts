import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const runs = await prisma.workflowRun.findMany({
            where: {
                workflowId: id,
                organizationId: user.organizationId,
            },
            orderBy: {
                startedAt: 'desc',
            },
            take: 50,
        });

        return NextResponse.json({
            ok: true,
            data: runs,
        });
    } catch (error) {
        console.error('Error fetching workflow runs:', error);

        if (error instanceof Error && error.message === 'Authentication required') {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json(
            { ok: false, error: 'Failed to fetch runs' },
            { status: 500 }
        );
    }
}