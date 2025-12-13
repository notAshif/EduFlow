/* eslint-disable @typescript-eslint/no-explicit-any */
type EventCallback = (data: any) => void;

class RealtimeBroadcaster {
    private subscribers: Map<string, Set<EventCallback>> = new Map();

    subscribe(channel: string, callback: EventCallback): () => void {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set());
        }

        this.subscribers.get(channel)!.add(callback);

        return () => {
            const channelSubs = this.subscribers.get(channel);
            if (channelSubs) {
                channelSubs.delete(callback);
                if (channelSubs.size === 0) {
                    this.subscribers.delete(channel);
                }
            }
        };
    }

    broadcast(channel: string, data: any): void {
        const channelSubs = this.subscribers.get(channel);
        if (channelSubs) {
            channelSubs.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }

    getSubscriberCount(channel: string): number {
        return this.subscribers.get(channel)?.size ?? 0;
    }
}

export const broadcaster = new RealtimeBroadcaster();

export type NotificationEventData = {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'workflow' | 'attendance' | 'assignment' | 'schedule' | 'system';
};

export type DashboardEvent =
    | { type: 'stats-update'; data: any }
    | { type: 'new-run'; data: any }
    | { type: 'run-complete'; data: any }
    | { type: 'workflow-created'; data: any }
    | { type: 'workflow-updated'; data: any }
    | { type: 'workflow-deleted'; data: any }
    | { type: 'notification'; data: NotificationEventData }
    | { type: 'node-status'; data: { runId: string; nodeId: string; status: 'running' | 'success' | 'error'; error?: string } }
    | { type: 'integration-missing'; data: { workflowId: string; workflowName: string; missing: string[] } };

export function emitDashboardEvent(event: DashboardEvent) {
    broadcaster.broadcast('dashboard', event);
}

export function emitNotification(notification: NotificationEventData) {
    broadcaster.broadcast('dashboard', { type: 'notification', data: notification });
}