// components/dashboard/realtime-notifications.tsx
'use client'

import { useEffect } from 'react'
import { broadcaster } from '@/lib/realtime'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useToast } from '@/hooks/use-toast'

export function RealtimeNotifications() {
    const { addNotification } = useNotificationStore()
    const { toast } = useToast()

    useEffect(() => {
        // Subscribe to dashboard events (notifications and others)
        const unsubscribe = broadcaster.subscribe('dashboard', (event) => {
            if (event.type === 'notification') {
                const { title, message, type, category } = event.data

                // 1. Add to persistent notification store (Zustand + LocalStorage)
                addNotification({
                    title,
                    message,
                    type,
                    category,
                })

                // 2. Show a toast notification for immediate feedback
                toast({
                    title: title,
                    description: message,
                    variant: type === 'error' ? 'destructive' : 'default',
                })
            }
        })

        return () => unsubscribe()
    }, [addNotification, toast])

    return null // This is a logic-only component
}
