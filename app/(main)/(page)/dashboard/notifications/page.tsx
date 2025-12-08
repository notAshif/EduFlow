'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Search,
    Filter,
    Workflow,
    Users,
    FileText,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Info,
    XCircle,
    Settings,
    RefreshCw,
    Sparkles,
} from 'lucide-react'
import { useNotificationStore, Notification } from '@/lib/stores/notification-store'

type FilterCategory = 'all' | 'workflow' | 'attendance' | 'assignment' | 'schedule' | 'system'
type FilterStatus = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Use the shared notification store
    const {
        notifications,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllRead,
        fetchNotifications,
        unreadCount,
    } = useNotificationStore()

    const unread = unreadCount()

    // Fetch on mount and set up real-time polling
    useEffect(() => {
        fetchNotifications()

        // Poll every 10 seconds for real-time updates
        const interval = setInterval(() => {
            fetchNotifications()
        }, 10000)

        return () => clearInterval(interval)
    }, [fetchNotifications])

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchNotifications()
        setTimeout(() => setIsRefreshing(false), 500)
    }

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = filterCategory === 'all' || notification.category === filterCategory
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'unread' && !notification.read) ||
            (filterStatus === 'read' && notification.read)
        return matchesSearch && matchesCategory && matchesStatus
    })

    const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
        if (!acc[notification.date]) {
            acc[notification.date] = []
        }
        acc[notification.date].push(notification)
        return acc
    }, {} as Record<string, Notification[]>)

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />
            default: return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    const getCategoryIcon = (category: Notification['category']) => {
        switch (category) {
            case 'workflow': return <Workflow className="w-4 h-4" />
            case 'attendance': return <Users className="w-4 h-4" />
            case 'assignment': return <FileText className="w-4 h-4" />
            case 'schedule': return <Calendar className="w-4 h-4" />
            default: return <Settings className="w-4 h-4" />
        }
    }

    const getCategoryColor = (category: Notification['category']) => {
        switch (category) {
            case 'workflow': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
            case 'attendance': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            case 'assignment': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
            case 'schedule': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
        }
    }

    // Show professional empty state when no notifications
    if (notifications.length === 0 && !isLoading) {
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="w-7 h-7 text-primary" />
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Stay updated with your workflow alerts, student activities, and system updates.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Empty State */}
                <Card className="border-dashed">
                    <CardContent className="py-16">
                        <div className="text-center max-w-md mx-auto">
                            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Bell className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                All Caught Up!
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                                You have no notifications right now. Notifications will appear here when you receive alerts about workflows, attendance, assignments, or system updates.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="w-4 h-4" />
                                <span>Real-time updates enabled</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Notification Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { label: 'Workflow Alerts', description: 'Get notified when workflows complete or fail', enabled: true },
                                { label: 'Assignment Updates', description: 'Notifications for new submissions', enabled: true },
                                { label: 'Attendance Alerts', description: 'Daily attendance summaries', enabled: true },
                                { label: 'Schedule Changes', description: 'Updates to class schedules', enabled: true },
                                { label: 'System Updates', description: 'Platform updates and maintenance', enabled: true },
                                { label: 'Email Digest', description: 'Daily email summary of notifications', enabled: false },
                            ].map((pref, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{pref.label}</p>
                                        <p className="text-xs text-muted-foreground">{pref.description}</p>
                                    </div>
                                    <button
                                        className={`relative w-11 h-6 rounded-full transition-colors ${pref.enabled ? 'bg-green-500' : 'bg-muted'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${pref.enabled ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="w-7 h-7 text-primary" />
                        Notifications
                        {isLoading && (
                            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Stay updated with your workflow alerts, student activities, and system updates.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {unread > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark all read
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={clearAllRead}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear read
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{notifications.length}</p>
                            <p className="text-sm text-blue-600/70">Total</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{unread}</p>
                            <p className="text-sm text-red-600/70">Unread</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{notifications.filter(n => n.type === 'success').length}</p>
                            <p className="text-sm text-green-600/70">Success</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{notifications.filter(n => n.type === 'warning' || n.type === 'error').length}</p>
                            <p className="text-sm text-yellow-600/70">Alerts</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                                <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                                {(['all', 'workflow', 'attendance', 'assignment', 'schedule', 'system'] as FilterCategory[]).map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${filterCategory === cat
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                                {(['all', 'unread', 'read'] as FilterStatus[]).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${filterStatus === status
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {status}
                                        {status === 'unread' && unread > 0 && (
                                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                                                {unread}
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List */}
            {Object.keys(groupedNotifications).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedNotifications).map(([date, notifs]) => (
                        <div key={date}>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{date}</h3>
                            <Card>
                                <CardContent className="p-0 divide-y">
                                    {notifs.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className="shrink-0 mt-1">
                                                    {getTypeIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                    {notification.title}
                                                                </h4>
                                                                <Badge variant="secondary" className={`text-xs ${getCategoryColor(notification.category)}`}>
                                                                    {getCategoryIcon(notification.category)}
                                                                    <span className="ml-1 capitalize">{notification.category}</span>
                                                                </Badge>
                                                                {!notification.read && (
                                                                    <Badge className="text-xs bg-primary">New</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                {notification.time}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {!notification.read && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                                onClick={() => deleteNotification(notification.id)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-lg mb-1">No notifications found</h3>
                        <p className="text-muted-foreground">
                            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                                ? 'Try adjusting your search or filters.'
                                : 'You\'re all caught up! New notifications will appear here.'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Notification Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Notification Preferences
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: 'Workflow Alerts', description: 'Get notified when workflows complete or fail', enabled: true },
                            { label: 'Assignment Updates', description: 'Notifications for new submissions', enabled: true },
                            { label: 'Attendance Alerts', description: 'Daily attendance summaries', enabled: true },
                            { label: 'Schedule Changes', description: 'Updates to class schedules', enabled: true },
                            { label: 'System Updates', description: 'Platform updates and maintenance', enabled: true },
                            { label: 'Email Digest', description: 'Daily email summary of notifications', enabled: false },
                        ].map((pref, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{pref.label}</p>
                                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                                </div>
                                <button
                                    className={`relative w-11 h-6 rounded-full transition-colors ${pref.enabled ? 'bg-green-500' : 'bg-muted'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${pref.enabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Real-time indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Real-time updates enabled • Auto-refreshing every 10 seconds
            </div>
        </div>
    )
}
