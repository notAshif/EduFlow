// app/(main)/(page)/dashboard/page.tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
    Plus,
    Clock,
    CheckCircle,
    XCircle,
    Activity,
    TrendingUp,
    Users,
    Zap,
    RefreshCw,
    Wifi,
    WifiOff,
    Search,
    ArrowRight,
    MoreHorizontal,
    Info
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// TODO: swap to Coconut UI Card when coconut-ui is available

interface DashboardStats {
    totalWorkflows: number
    activeWorkflows: number
    totalRuns: number
    successRate: number
    activeUsers: number
}

interface RecentRun {
    id: string
    workflowId: string
    workflowName: string
    status: string
    startedAt: string
    finishedAt: string | null
    duration: number | null
}

// --- Activity Card Components ---

function ActivityRing({
    radius,
    stroke,
    progress,
    color,
    delay = 0
}: {
    radius: number
    stroke: number
    progress: number
    color: string
    delay?: number
}) {
    const normalizedRadius = radius - stroke * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <div className="relative flex items-center justify-center">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="rotate-[-90deg] transition-all duration-1000 ease-out"
            >
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeOpacity="0.1"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={color}
                />
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={color}
                />
            </svg>
        </div>
    )
}

function ActivityCard({ stats }: { stats: DashboardStats }) {
    return (
        <Card className="border border-border/50 shadow-lg bg-card/50 backdrop-blur-xl overflow-hidden relative h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-24 h-24" />
            </div>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">System Health</CardTitle>
                <p className="text-sm text-muted-foreground">Real-time performance metrics</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Outer Ring: Success Rate */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ActivityRing
                            radius={90}
                            stroke={12}
                            progress={stats.successRate}
                            color="text-green-500"
                        />
                    </div>
                    {/* Middle Ring: Active Workflows (normalized to 100 for visual) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ActivityRing
                            radius={70}
                            stroke={12}
                            progress={Math.min((stats.activeWorkflows / (stats.totalWorkflows || 1)) * 100, 100)}
                            color="text-blue-500"
                        />
                    </div>
                    {/* Inner Ring: Active Users (arbitrary scale for demo) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ActivityRing
                            radius={50}
                            stroke={12}
                            progress={Math.min(stats.activeUsers * 10, 100)}
                            color="text-red-500"
                        />
                    </div>

                    {/* Center Text */}
                    <div className="flex flex-col items-center z-10">
                        <span className="text-3xl font-bold">{stats.successRate}%</span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Health</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full mt-3">
                    <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Success</span>
                        <span className="text-lg font-bold text-green-500">{stats.successRate}%</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Active</span>
                        <span className="text-lg font-bold text-blue-500">{stats.activeWorkflows}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <span className="text-xs text-muted-foreground mb-1">Users</span>
                        <span className="text-lg font-bold text-red-500">{stats.activeUsers}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Main Page Component ---

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalWorkflows: 0,
        activeWorkflows: 0,
        totalRuns: 0,
        successRate: 0,
        activeUsers: 0
    })

    const [recentRuns, setRecentRuns] = useState<RecentRun[]>([])
    const [loading, setLoading] = useState(true)
    const [isConnected, setIsConnected] = useState(false)
    const [isTriggering, setIsTriggering] = useState(false)

    // Search functionality
    const [searchQuery, setSearchQuery] = useState('')
    const [searchLoading, setSearchLoading] = useState(false)
    const [searchResults, setSearchResults] = useState<RecentRun[]>([])
    const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const eventSourceRef = useRef<EventSource | null>(null)
    const { toast } = useToast()

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true)

                // Fetch stats
                const statsRes = await fetch('/api/dashboard/stats')
                const statsData = await statsRes.json()

                if (statsData.ok) {
                    setStats(statsData.data)
                }

                // Fetch recent runs
                const runsRes = await fetch('/api/dashboard/recent-runs')
                const runsData = await runsRes.json()

                if (runsData.ok) {
                    setRecentRuns(runsData.data)
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load dashboard data',
                    variant: 'destructive',
                })
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [toast])

    // Setup SSE connection
    useEffect(() => {
        let reconnectTimeout: NodeJS.Timeout
        let reconnectAttempts = 0
        const maxReconnectAttempts = 5

        const connectSSE = () => {
            try {
                const eventSource = new EventSource('/api/dashboard/stream')
                eventSourceRef.current = eventSource

                eventSource.onopen = () => {
                    console.log('SSE connected')
                    setIsConnected(true)
                    reconnectAttempts = 0
                }

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data)

                        if (data.type === 'connected') {
                            console.log('SSE connection established:', data.timestamp)
                            return
                        }

                        if (data.type === 'stats-update') {
                            setStats(prev => ({
                                ...prev,
                                ...data.data
                            }))
                        }

                        if (data.type === 'new-run') {
                            setRecentRuns(prev => [data.data, ...prev.slice(0, 9)])

                            toast({
                                title: 'New Workflow Run',
                                description: `${data.data.workflowName} - ${data.data.status}`,
                                variant: data.data.status === 'SUCCESS' ? 'default' : 'destructive',
                            })
                        }

                        if (data.type === 'workflow-created') {
                            toast({
                                title: 'New Workflow Created',
                                description: `"${data.data.name}" has been added`,
                            })
                        }
                    } catch (error) {
                        console.error('Error parsing SSE message:', error)
                    }
                }

                eventSource.onerror = (error) => {
                    console.error('SSE error:', error)
                    setIsConnected(false)
                    eventSource.close()

                    // Attempt reconnection with exponential backoff
                    if (reconnectAttempts < maxReconnectAttempts) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
                        reconnectAttempts++

                        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)

                        reconnectTimeout = setTimeout(() => {
                            connectSSE()
                        }, delay)
                    } else {
                        toast({
                            title: 'Connection Lost',
                            description: 'Unable to establish real-time connection. Please refresh the page.',
                            variant: 'destructive',
                        })
                    }
                }
            } catch (error) {
                console.error('Error creating EventSource:', error)
            }
        }

        connectSSE()

        // Cleanup
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout)
            }
        }
    }, [toast])

    // Client-side search with debouncing (300ms)
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (!searchQuery.trim()) {
            setSearchResults([])
            setSearchLoading(false)
            return
        }

        setSearchLoading(true)

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const query = searchQuery.toLowerCase()
                const filteredRuns = recentRuns.filter(run =>
                    run.workflowName.toLowerCase().includes(query) ||
                    run.id.toLowerCase().includes(query) ||
                    run.status.toLowerCase().includes(query)
                )

                setSearchResults(filteredRuns)
                setSearchLoading(false)
            } catch (error) {
                console.error('Search error:', error)
                setSearchLoading(false)
            }
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery, recentRuns])

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        } else if (e.key === 'Escape') {
            setSearchQuery('')
            setSearchResults([])
                ; (e.target as HTMLInputElement).blur()
        }
    }

    const handleTriggerRun = async () => {
        try {
            setIsTriggering(true)
            const res = await fetch('/api/dashboard/trigger-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: Math.random() > 0.3 ? 'SUCCESS' : 'FAILED' }),
            })

            const data = await res.json()

            if (data.ok) {
                toast({
                    title: 'Workflow Triggered',
                    description: 'A test workflow run has been started',
                })
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Failed to trigger run:', error)
            toast({
                title: 'Error',
                description: 'Failed to trigger workflow run',
                variant: 'destructive',
            })
        } finally {
            setIsTriggering(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'FAILED':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'RUNNING':
                return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
            default:
                return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            SUCCESS: 'default',
            FAILED: 'destructive',
            RUNNING: 'secondary',
            PENDING: 'secondary'
        } as const

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                {status}
            </Badge>
        )
    }

    const displayedRuns = useMemo(() => {
        return searchQuery.trim() ? searchResults : recentRuns
    }, [searchQuery, searchResults, recentRuns])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-1 sm:p-4 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/30 backdrop-blur-md p-6 rounded-2xl border border-border/50 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Overview of your automation ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-3 px-4 py-2 bg-background/50 rounded-full border border-border/50">
                        {isConnected ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">System Online</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-500" />
                                <span className="text-sm font-medium text-red-500">Offline</span>
                            </>
                        )}
                    </div>

                    <div className="h-8 w-[1px] bg-border/50 hidden sm:block"></div>

                    {/* Advanced Tooltip */}
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary transition-colors">
                                    <Info className="w-5 h-5" />
                                    <span className="sr-only">Dashboard Info</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="end" className="p-4 bg-popover/95 backdrop-blur-lg border-border/50 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2">
                                <div className="text-sm max-w-[280px] space-y-2">
                                    <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-2">
                                        <div className="p-1 bg-primary/10 rounded-md">
                                            <Zap className="w-3 h-3 text-primary" />
                                        </div>
                                        <p className="font-semibold text-foreground">Advanced Dashboard Tips</p>
                                    </div>
                                    <p className="text-muted-foreground text-xs leading-relaxed">
                                        You can see workflow insights, activity stats, and quick actions here.
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Metrics & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Workflows</CardTitle>
                                <Zap className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalWorkflows}</div>
                                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                                    {stats.activeWorkflows} active
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-900/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Runs</CardTitle>
                                <Activity className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalRuns}</div>
                                <p className="text-xs text-purple-600/80 dark:text-purple-400/80">
                                    Lifetime executions
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-100 dark:border-green-900/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Success Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.successRate}%</div>
                                <p className="text-xs text-green-600/80 dark:text-green-400/80">
                                    Reliability score
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/30">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Users</CardTitle>
                                <Users className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.activeUsers}</div>
                                <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                                    Last 30 days
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Runs Table */}
                    <Card className="border border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between py-4">
                            <div className="flex flex-col gap-1">
                                <CardTitle>Recent Activity</CardTitle>
                                <p className="text-sm text-muted-foreground">Monitor your latest workflow executions</p>
                            </div>
                            <div className="relative w-full max-w-xs hidden sm:block">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search runs..."
                                    className="w-full bg-background rounded-lg border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium">Workflow</th>
                                            <th className="px-6 py-3 font-medium">Time</th>
                                            <th className="px-6 py-3 font-medium">Duration</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {displayedRuns.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                    {searchQuery
                                                        ? `No results found for "${searchQuery}"`
                                                        : 'No workflow runs yet. Create a workflow to get started!'}
                                                </td>
                                            </tr>
                                        ) : (
                                            displayedRuns.map((run) => (
                                                <tr key={run.id} className="bg-card hover:bg-muted/30 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(run.status)}
                                                            {getStatusBadge(run.status)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {run.workflowName}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                                        {new Date(run.startedAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {run.duration !== null ? `${Math.round(run.duration / 1000)}s` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {!searchQuery && (
                                <div className="p-4 border-t border-border/50 bg-muted/10">
                                    <Link href="/dashboard/workflows">
                                        <Button variant="ghost" className="w-full text-muted-foreground hover:text-primary">
                                            View All Workflows <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Activity Card & Quick Actions */}
                <div className="space-y-8">
                    {/* Apple Activity Style Card */}
                    <div className="h-[400px]">
                        <ActivityCard stats={stats} />
                    </div>

                    {/* Quick Actions */}
                    <Card className="border border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/dashboard/workflows/new">
                                <Button className="w-full justify-start h-12 mb-4 text-base shadow-md hover:shadow-lg transition-all">
                                    <Plus className="w-5 h-5 mr-3" />
                                    Create New Workflow
                                </Button>
                            </Link>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/dashboard/integration">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                                        Integrations
                                    </Button>
                                </Link>
                                <Link href="/dashboard/assignments">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                                        <Plus className="w-4 h-4 mr-2 text-blue-500" />
                                        Assignment
                                    </Button>
                                </Link>
                                <Link href="/dashboard/attendance">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                                        <Users className="w-4 h-4 mr-2 text-green-500" />
                                        Attendance
                                    </Button>
                                </Link>
                                <Link href="/dashboard/settings">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3">
                                        <Activity className="w-4 h-4 mr-2 text-purple-500" />
                                        Settings
                                    </Button>
                                </Link>
                            </div>

                            {process.env.NODE_ENV === 'development' && (
                                <div className="pt-4 mt-4 border-t border-border/50">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Dev Tools</p>
                                    <Button
                                        variant="secondary"
                                        className="w-full justify-start border-dashed border border-border"
                                        onClick={handleTriggerRun}
                                        disabled={isTriggering}
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${isTriggering ? 'animate-spin' : ''}`} />
                                        Trigger Test Run
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
