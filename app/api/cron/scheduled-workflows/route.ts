// app/api/cron/scheduled-workflows/route.ts
// This endpoint is called by a cron job (or can be called manually) to execute scheduled workflows

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { WorkflowExecutor } from '@/lib/workflow/executor';

// Vercel cron or external cron service will call this
// Set up cron to call every minute: * * * * *
export async function GET(request: NextRequest) {
    // Optional: Add a secret key for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        // Allow in development or if no secret is set
        if (process.env.NODE_ENV === 'production' && cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const now = new Date();

        // Find all pending scheduled workflows that are due
        const dueSchedules = await prisma.scheduledWorkflow.findMany({
            where: {
                status: 'PENDING',
                scheduledAt: {
                    lte: now,
                },
            },
            take: 10, // Process up to 10 at a time to avoid timeout
        });

        console.log(`[CRON] Found ${dueSchedules.length} scheduled workflows to execute`);

        const results = [];
        const executor = new WorkflowExecutor();

        for (const schedule of dueSchedules) {
            try {
                console.log(`[CRON] Executing scheduled workflow: ${schedule.workflowId}`);

                // Mark as executing (prevent duplicate execution)
                await prisma.scheduledWorkflow.update({
                    where: { id: schedule.id },
                    data: { status: 'EXECUTING' },
                });

                // Execute the workflow
                const payload = (schedule.payload as Record<string, any>) || {};
                const runId = await executor.execute(schedule.workflowId, payload);

                // Mark as executed
                await prisma.scheduledWorkflow.update({
                    where: { id: schedule.id },
                    data: {
                        status: 'EXECUTED',
                        executedAt: new Date(),
                    },
                });

                results.push({
                    scheduleId: schedule.id,
                    workflowId: schedule.workflowId,
                    runId,
                    status: 'EXECUTED',
                });

                console.log(`[CRON] ✓ Successfully executed workflow ${schedule.workflowId} -> run ${runId}`);
            } catch (error) {
                console.error(`[CRON] ✗ Failed to execute scheduled workflow ${schedule.id}:`, error);

                // Mark as failed
                await prisma.scheduledWorkflow.update({
                    where: { id: schedule.id },
                    data: {
                        status: 'FAILED',
                        executedAt: new Date(),
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    },
                });

                results.push({
                    scheduleId: schedule.id,
                    workflowId: schedule.workflowId,
                    status: 'FAILED',
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return NextResponse.json({
            ok: true,
            processed: dueSchedules.length,
            results,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error('[CRON] Error processing scheduled workflows:', error);
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Cron job failed' },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
