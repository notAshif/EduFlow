// lib/services/scheduler.ts
// Background scheduler that checks and executes scheduled workflows

class WorkflowScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private checkIntervalMs: number = 30000; // Check every 30 seconds

    start() {
        if (this.isRunning) {
            console.log('[SCHEDULER] Already running');
            return;
        }

        console.log('[SCHEDULER] Starting workflow scheduler...');
        this.isRunning = true;

        // Run immediately
        this.checkScheduledWorkflows();

        // Then run periodically
        this.intervalId = setInterval(() => {
            this.checkScheduledWorkflows();
        }, this.checkIntervalMs);

        console.log(`[SCHEDULER] ✓ Started. Checking every ${this.checkIntervalMs / 1000}s`);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('[SCHEDULER] Stopped');
    }

    private async checkScheduledWorkflows() {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            const response = await fetch(`${baseUrl}/api/cron/scheduled-workflows`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.processed > 0) {
                console.log(`[SCHEDULER] Executed ${data.processed} scheduled workflow(s)`);
                data.results?.forEach((result: any) => {
                    if (result.status === 'EXECUTED') {
                        console.log(`  ✓ ${result.workflowId} -> run ${result.runId}`);
                    } else {
                        console.log(`  ✗ ${result.workflowId} failed: ${result.error}`);
                    }
                });
            }
        } catch (error) {
            // Silently fail - server might not be ready yet
            if (process.env.NODE_ENV === 'development') {
                // Only log in development if it's not a connection error
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                if (!errorMessage.includes('ECONNREFUSED')) {
                    console.error('[SCHEDULER] Check failed:', errorMessage);
                }
            }
        }
    }

    isActive() {
        return this.isRunning;
    }
}

// Singleton instance
let schedulerInstance: WorkflowScheduler | null = null;

export function getScheduler(): WorkflowScheduler {
    if (!schedulerInstance) {
        schedulerInstance = new WorkflowScheduler();
    }
    return schedulerInstance;
}

export function startScheduler() {
    const scheduler = getScheduler();
    scheduler.start();
}

export function stopScheduler() {
    if (schedulerInstance) {
        schedulerInstance.stop();
    }
}

// Auto-start in development when this module is imported
if (typeof window === 'undefined') {
    // Only run on server side
    // Start after a delay to ensure server is ready
    setTimeout(() => {
        startScheduler();
    }, 5000);
}
