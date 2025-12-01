// app/api/dashboard/emit/route.ts
// Dev-only endpoint for manual event emission during testing
import { NextRequest, NextResponse } from 'next/server';
import { emitDashboardEvent } from '@/lib/realtime';

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production' && process.env.DEV_REALTIME !== 'true') {
        return NextResponse.json(
            { ok: false, error: 'This endpoint is only available in development' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { ok: false, error: 'Missing type or data in request body' },
                { status: 400 }
            );
        }

        // Emit the event
        emitDashboardEvent({ type, data });

        return NextResponse.json({
            ok: true,
            message: `Event '${type}' emitted successfully`,
        });
    } catch (error) {
        console.error('Error emitting event:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to emit event' },
            { status: 500 }
        );
    }
}
