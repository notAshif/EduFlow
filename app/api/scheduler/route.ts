// app/api/scheduler/route.ts
// API endpoint to manage the workflow scheduler

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/services/scheduler';

// Track if scheduler has been started
let schedulerInitialized = false;

// GET - Get scheduler status or initialize it
export async function GET() {
    const scheduler = getScheduler();

    // Auto-start on first request
    if (!schedulerInitialized) {
        scheduler.start();
        schedulerInitialized = true;
    }

    return NextResponse.json({
        ok: true,
        active: scheduler.isActive(),
        message: scheduler.isActive()
            ? 'Scheduler is running and checking for scheduled workflows every 30s'
            : 'Scheduler is not running'
    });
}

// POST - Control scheduler
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        const scheduler = getScheduler();

        switch (action) {
            case 'start':
                scheduler.start();
                schedulerInitialized = true;
                return NextResponse.json({
                    ok: true,
                    message: 'Scheduler started'
                });

            case 'stop':
                scheduler.stop();
                return NextResponse.json({
                    ok: true,
                    message: 'Scheduler stopped'
                });

            case 'status':
                return NextResponse.json({
                    ok: true,
                    active: scheduler.isActive()
                });

            default:
                return NextResponse.json(
                    { ok: false, error: `Unknown action: ${action}` },
                    { status: 400 }
                );
        }
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed' },
            { status: 500 }
        );
    }
}
