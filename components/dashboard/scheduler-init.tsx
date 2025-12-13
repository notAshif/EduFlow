// components/dashboard/scheduler-init.tsx
"use client";

import { useEffect } from 'react';

export function SchedulerInit() {
    useEffect(() => {
        // Initialize scheduler when dashboard loads
        const initScheduler = async () => {
            try {
                await fetch('/api/scheduler');
                console.log('[DASHBOARD] Scheduler initialized');
            } catch (error) {
                // Silently fail - not critical
            }
        };

        initScheduler();
    }, []);

    // This component doesn't render anything
    return null;
}
