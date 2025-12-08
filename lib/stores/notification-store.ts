// lib/stores/notification-store.ts
import { create } from 'zustand'

export interface Notification {
    id: string
    title: string
    message: string
    time: string
    date: string
    read: boolean
    type: 'info' | 'success' | 'warning' | 'error'
    category: 'workflow' | 'attendance' | 'assignment' | 'schedule' | 'system'
    createdAt: Date
}

interface NotificationStore {
    notifications: Notification[]
    isLoading: boolean
    lastFetch: Date | null

    // Actions
    setNotifications: (notifications: Notification[]) => void
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    deleteNotification: (id: string) => void
    clearAllRead: () => void
    fetchNotifications: () => Promise<void>

    // Computed
    unreadCount: () => number
}

// Helper to format relative time
const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
}

const formatDate = (date: Date): string => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return 'This Week'
    return 'Earlier'
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    // Start with empty notifications - no mock data
    notifications: [],
    isLoading: false,
    lastFetch: null,

    setNotifications: (notifications) => set({ notifications }),

    addNotification: (notification) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}`,
            createdAt: new Date(),
            time: 'Just now',
            date: 'Today',
        }
        set((state) => ({
            notifications: [newNotification, ...state.notifications],
        }))
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
        }))
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }))
    },

    deleteNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }))
    },

    clearAllRead: () => {
        set((state) => ({
            notifications: state.notifications.filter((n) => !n.read),
        }))
    },

    fetchNotifications: async () => {
        set({ isLoading: true })
        try {
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                if (data.notifications && Array.isArray(data.notifications)) {
                    // Transform dates back to proper format
                    const notifications = data.notifications.map((n: any) => ({
                        ...n,
                        createdAt: new Date(n.createdAt),
                        time: formatRelativeTime(new Date(n.createdAt)),
                        date: formatDate(new Date(n.createdAt)),
                    }))
                    set({
                        notifications,
                        lastFetch: new Date(),
                    })
                }
            }
        } catch (error) {
            // API might not exist yet - that's fine, keep empty array
            console.log('Notifications API not available yet')
        } finally {
            set({ isLoading: false })
        }
    },

    unreadCount: () => {
        return get().notifications.filter((n) => !n.read).length
    },
}))

// Hook for real-time notifications polling
export const useNotificationPolling = (intervalMs: number = 30000) => {
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications)

    // This would be used in a useEffect in the component
    return { fetchNotifications, intervalMs }
}

// Export helper functions for use in other components
export { formatRelativeTime, formatDate }
