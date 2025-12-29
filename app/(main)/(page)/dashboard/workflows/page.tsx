// app/(main)/(page)/dashboard/workflows/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Play,
  Edit,
  Trash2,
  Copy,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
  LogIn,
  Calendar,
  AlarmClock,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Workflow {
  id: string
  name: string
  enabled: boolean
  createdAt: string
  lastRun?: {
    status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'
    startedAt: string
    duration: number | null
  }
  runCount: number
  isNew?: boolean // For highlighting newly created workflows
}

export default function WorkflowsPage() {
  const { isLoaded, isSignedIn } = useAuth()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [isScheduling, setIsScheduling] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const { toast } = useToast()

  // Fetch workflows from API
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchWorkflows()
    } else if (isLoaded && !isSignedIn) {
      setLoading(false)
      setAuthError(true)
    }
  }, [isLoaded, isSignedIn])

  // Setup SSE for real-time updates (only if signed in)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const connectSSE = () => {
      try {
        const eventSource = new EventSource('/api/dashboard/stream')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('Workflows SSE connected')
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'workflow-created') {
              // Add new workflow with highlight animation
              setWorkflows(prev => [{
                ...data.data,
                isNew: true,
              }, ...prev])

              // Remove highlight after 3 seconds
              setTimeout(() => {
                setWorkflows(prev => prev.map(wf =>
                  wf.id === data.data.id ? { ...wf, isNew: false } : wf
                ))
              }, 3000)

              toast({
                title: 'New Workflow Created',
                description: `"${data.data.name}" has been added`,
              })
            }

            if (data.type === 'workflow-updated') {
              setWorkflows(prev => prev.map(wf =>
                wf.id === data.data.id ? { ...wf, ...data.data } : wf
              ))
            }

            if (data.type === 'workflow-deleted') {
              setWorkflows(prev => prev.filter(wf => wf.id !== data.data.id))
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = () => {
          setIsConnected(false)
          eventSource.close()
          // Don't log error for auth issues - handled by the API response
        }
      } catch (error) {
        console.error('Error creating EventSource:', error)
      }
    }

    connectSSE()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [isLoaded, isSignedIn, toast])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      setAuthError(false)
      const response = await fetch('/api/workflows')

      if (response.status === 401) {
        setAuthError(true)
        setWorkflows([])
        return
      }

      const data = await response.json()

      if (data.ok) {
        setWorkflows(data.data)
      } else {
        // Don't throw error for auth issues
        if (data.error?.includes('Authentication')) {
          setAuthError(true)
        } else {
          console.error('Failed to fetch workflows:', data.error)
        }
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.status === 401) {
        setAuthError(true)
        return
      }

      const data = await response.json()

      if (data.ok) {
        toast({
          title: 'Workflow Started',
          description: 'Workflow execution has been triggered',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to run workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to run workflow',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        setAuthError(true)
        return
      }

      const data = await response.json()

      if (data.ok) {
        setWorkflows(prev => prev.filter(wf => wf.id !== workflowId))
        toast({
          title: 'Workflow Deleted',
          description: `"${workflowName}" has been deleted`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicateWorkflow = async (workflowId: string, workflowName: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/duplicate`, {
        method: 'POST',
      })

      if (response.status === 401) {
        setAuthError(true)
        return
      }

      const data = await response.json()

      if (data.ok) {
        toast({
          title: 'Workflow Duplicated',
          description: `"${workflowName}" has been cloned successfully`,
        })

        // Manual update in case SSE is disconnected or slow
        setWorkflows(prev => {
          // Check if it already exists from SSE to avoid doubles
          if (prev.some(wf => wf.id === data.data.id)) return prev;

          return [{
            ...data.data,
            runCount: 0,
            isNew: true
          }, ...prev]
        })

        // Remove highlight after 3 seconds
        setTimeout(() => {
          setWorkflows(prev => prev.map(wf =>
            wf.id === data.data.id ? { ...wf, isNew: false } : wf
          ))
        }, 3000)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to duplicate workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to duplicate workflow',
        variant: 'destructive',
      })
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

  const handleScheduleWorkflow = async () => {
    if (!selectedWorkflow || !scheduleDate || !scheduleTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time',
        variant: 'destructive',
      })
      return
    }

    setIsScheduling(true)

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

      const response = await fetch(`/api/workflows/${selectedWorkflow.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      })

      const data = await response.json()

      if (data.ok) {
        toast({
          title: 'Workflow Scheduled',
          description: `"${selectedWorkflow.name}" will run on ${new Date(scheduledAt).toLocaleString()}`,
        })
        setShowScheduleModal(false)
        setSelectedWorkflow(null)
        setScheduleDate('')
        setScheduleTime('')
      } else {
        throw new Error(data.error || 'Failed to schedule')
      }
    } catch (error) {
      console.error('Failed to schedule workflow:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule workflow',
        variant: 'destructive',
      })
    } finally {
      setIsScheduling(false)
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Still loading auth state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Not signed in
  if (!isSignedIn || authError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <LogIn className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Sign in to view workflows</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please sign in to access your workflows and create new automations.
        </p>
        <Link href="/sign-in">
          <Button>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-1">Manage and automate your educational workflows</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-muted-foreground">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </div>
          <Link href="/dashboard/workflows/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkflows.map((workflow) => (
          <Card
            key={workflow.id}
            className={`hover:shadow-lg transition-all duration-300 ${workflow.isNew ? 'animate-pulse-slow ring-2 ring-primary' : ''
              }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{workflow.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/workflows/${workflow.id}/edit`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDuplicateWorkflow(workflow.id, workflow.name)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedWorkflow(workflow)
                        setShowScheduleModal(true)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                  {workflow.enabled ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {workflow.runCount} runs
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last Run Status */}
              {workflow.lastRun && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(workflow.lastRun.status)}
                    <span className="text-sm font-medium">
                      {workflow.lastRun.status}
                    </span>
                  </div>
                  {workflow.lastRun.duration !== null && (
                    <span className="text-xs text-muted-foreground">
                      {Math.round(workflow.lastRun.duration / 1000)}s
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRunWorkflow(workflow.id)}
                  disabled={!workflow.enabled}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/workflows/${workflow.id}/edit`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground">
                Created {new Date(workflow.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkflows.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No workflows found' : 'No workflows yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first workflow to get started with automation'
              }
            </p>
            {!searchQuery && (
              <Link href="/dashboard/workflows/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlarmClock className="w-5 h-5 text-primary" />
                  Schedule Workflow
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule &quot;{selectedWorkflow.name}&quot; to run automatically
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowScheduleModal(false)
                  setSelectedWorkflow(null)
                  setScheduleDate('')
                  setScheduleTime('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full"
                />
              </div>

              {scheduleDate && scheduleTime && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Scheduled for:</p>
                  <p className="text-lg font-semibold">
                    {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowScheduleModal(false)
                    setSelectedWorkflow(null)
                    setScheduleDate('')
                    setScheduleTime('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleScheduleWorkflow}
                  disabled={isScheduling || !scheduleDate || !scheduleTime}
                >
                  {isScheduling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}