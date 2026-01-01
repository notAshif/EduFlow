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
    initialized: boolean

    // Actions
    setNotifications: (notifications: Notification[]) => void
    addNotification: (notification: Partial<Notification> & { title: string; message: string }) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    deleteNotification: (id: string) => void
    clearAllRead: () => void
    fetchNotifications: () => Promise<void>
    initialize: () => void

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

const STORAGE_KEY = 'eduflow_notifications'

// Load notifications from localStorage
const loadFromStorage = (): Notification[] => {
    if (typeof window === 'undefined') return []
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            const parsed = JSON.parse(saved)
            return parsed.map((n: any) => ({
                ...n,
                createdAt: new Date(n.createdAt),
                time: formatRelativeTime(new Date(n.createdAt)),
                date: formatDate(new Date(n.createdAt)),
            }))
        }
    } catch (e) {
        console.error('Error loading notifications from storage:', e)
    }
    return []
}

// Save notifications to localStorage
const saveToStorage = (notifications: Notification[]) => {
    if (typeof window === 'undefined') return
    try {
        const toSave = notifications.map(n => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
        }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) {
        console.error('Error saving notifications to storage:', e)
    }
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    // Start with empty notifications - will load from localStorage
    notifications: [],
    isLoading: false,
    lastFetch: null,
    initialized: false,

    initialize: () => {
        if (get().initialized) return
        const stored = loadFromStorage()
        set({ notifications: stored, initialized: true })
    },

    setNotifications: (notifications) => {
        set({ notifications })
        saveToStorage(notifications)
    },

    addNotification: (notification) => {
        const { title, message, type = 'info', category = 'system' } = notification
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            title,
            message,
            type: type as any,
            category: category as any,
            read: false,
            createdAt: new Date(),
            time: 'Just now',
            date: 'Today',
        }
        const updated = [newNotification, ...get().notifications]
        set({ notifications: updated })
        saveToStorage(updated)
    },

    markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
        )
        set({ notifications: updated })
        saveToStorage(updated)
    },

    markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, read: true }))
        set({ notifications: updated })
        saveToStorage(updated)
    },

    deleteNotification: (id) => {
        const updated = get().notifications.filter((n) => n.id !== id)
        set({ notifications: updated })
        saveToStorage(updated)
    },

    clearAllRead: () => {
        const updated = get().notifications.filter((n) => !n.read)
        set({ notifications: updated })
        saveToStorage(updated)
    },

    fetchNotifications: async () => {
        // Initialize from localStorage first if not done
        if (!get().initialized) {
            get().initialize()
        }

        set({ isLoading: true })
        try {
            // Try to fetch from API for any new server-side notifications
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                if (data.notifications && Array.isArray(data.notifications) && data.notifications.length > 0) {
                    // Merge with existing notifications (avoid duplicates)
                    const existingIds = new Set(get().notifications.map(n => n.id))
                    const newNotifications = data.notifications
                        .filter((n: any) => !existingIds.has(n.id))
                        .map((n: any) => ({
                            ...n,
                            createdAt: new Date(n.createdAt),
                            time: formatRelativeTime(new Date(n.createdAt)),
                            date: formatDate(new Date(n.createdAt)),
                        }))

                    if (newNotifications.length > 0) {
                        const merged = [...newNotifications, ...get().notifications]
                        set({ notifications: merged, lastFetch: new Date() })
                        saveToStorage(merged)
                    }
                }
            }
        } catch (error) {
            // API might not exist yet - use localStorage data
            console.log('Using localStorage notifications')
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
