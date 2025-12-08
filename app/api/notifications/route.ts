// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// In-memory storage for demo (replace with database in production)
const notificationsStore: Map<string, Notification[]> = new Map()

interface Notification {
    id: string
    title: string
    message: string
    time: string
    date: string
    read: boolean
    type: 'info' | 'success' | 'warning' | 'error'
    category: 'workflow' | 'attendance' | 'assignment' | 'schedule' | 'system'
    createdAt: string
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

// Generate sample notifications for a user
const generateSampleNotifications = (): Notification[] => {
    const now = new Date()
    return [
        {
            id: '1',
            title: 'Workflow Completed',
            message: 'Attendance reminder workflow sent to 45 parents via WhatsApp successfully.',
            time: formatRelativeTime(new Date(now.getTime() - 5 * 60000)),
            date: 'Today',
            read: false,
            type: 'success',
            category: 'workflow',
            createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
        },
        {
            id: '2',
            title: 'New Assignment Submissions',
            message: '12 students submitted Math Quiz #3. Click to review submissions.',
            time: formatRelativeTime(new Date(now.getTime() - 60 * 60000)),
            date: 'Today',
            read: false,
            type: 'info',
            category: 'assignment',
            createdAt: new Date(now.getTime() - 60 * 60000).toISOString(),
        },
        {
            id: '3',
            title: 'WhatsApp API Warning',
            message: 'You are approaching your daily message limit (450/500).',
            time: formatRelativeTime(new Date(now.getTime() - 2 * 60 * 60000)),
            date: 'Today',
            read: false,
            type: 'warning',
            category: 'system',
            createdAt: new Date(now.getTime() - 2 * 60 * 60000).toISOString(),
        },
        {
            id: '4',
            title: 'Attendance Marked',
            message: 'Class 10-A attendance marked. 2 students absent.',
            time: formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60000)),
            date: 'Today',
            read: true,
            type: 'info',
            category: 'attendance',
            createdAt: new Date(now.getTime() - 3 * 60 * 60000).toISOString(),
        },
        {
            id: '5',
            title: 'Parent Meeting Reminder',
            message: 'Parent-teacher meeting scheduled for tomorrow at 4:00 PM.',
            time: formatRelativeTime(new Date(now.getTime() - 4 * 60 * 60000)),
            date: 'Today',
            read: true,
            type: 'info',
            category: 'schedule',
            createdAt: new Date(now.getTime() - 4 * 60 * 60000).toISOString(),
        },
    ]
}

// GET - Fetch notifications
export async function GET() {
    try {
        const user = await getCurrentUser()
        const userId = user?.id || 'anonymous'

        // Get or create notifications for this user
        if (!notificationsStore.has(userId)) {
            notificationsStore.set(userId, generateSampleNotifications())
        }

        const notifications = notificationsStore.get(userId) || []

        return NextResponse.json({
            notifications,
            unreadCount: notifications.filter(n => !n.read).length,
        })
    } catch (error) {
        console.error('[NOTIFICATIONS] Error fetching:', error)
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        const userId = user?.id || 'anonymous'
        const body = await request.json()

        const { title, message, type = 'info', category = 'system' } = body

        if (!title || !message) {
            return NextResponse.json(
                { error: 'Title and message are required' },
                { status: 400 }
            )
        }

        const now = new Date()
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            title,
            message,
            time: 'Just now',
            date: 'Today',
            read: false,
            type,
            category,
            createdAt: now.toISOString(),
        }

        const notifications = notificationsStore.get(userId) || []
        notifications.unshift(newNotification)
        notificationsStore.set(userId, notifications)

        return NextResponse.json({
            success: true,
            notification: newNotification,
        })
    } catch (error) {
        console.error('[NOTIFICATIONS] Error creating:', error)
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        )
    }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        const userId = user?.id || 'anonymous'
        const body = await request.json()

        const { id, markAll } = body

        const notifications = notificationsStore.get(userId) || []

        if (markAll) {
            notifications.forEach(n => n.read = true)
        } else if (id) {
            const notification = notifications.find(n => n.id === id)
            if (notification) {
                notification.read = true
            }
        }

        notificationsStore.set(userId, notifications)

        return NextResponse.json({
            success: true,
            unreadCount: notifications.filter(n => !n.read).length,
        })
    } catch (error) {
        console.error('[NOTIFICATIONS] Error updating:', error)
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        )
    }
}

// DELETE - Delete notification(s)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        const userId = user?.id || 'anonymous'
        const { searchParams } = new URL(request.url)

        const id = searchParams.get('id')
        const clearRead = searchParams.get('clearRead') === 'true'

        let notifications = notificationsStore.get(userId) || []

        if (clearRead) {
            notifications = notifications.filter(n => !n.read)
        } else if (id) {
            notifications = notifications.filter(n => n.id !== id)
        }

        notificationsStore.set(userId, notifications)

        return NextResponse.json({
            success: true,
            remaining: notifications.length,
        })
    } catch (error) {
        console.error('[NOTIFICATIONS] Error deleting:', error)
        return NextResponse.json(
            { error: 'Failed to delete notification' },
            { status: 500 }
        )
    }
}
