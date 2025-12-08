// app/dashboard/assignments/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Search,
  Calendar,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  TrendingUp
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  createdAt: string
  submissionsCount: number
  totalStudents: number
  status: 'draft' | 'published' | 'closed'
  totalMarks?: number
  subject?: string
}

interface TeachUsAssignment {
  title: string
  subject: string
  dueDate: string
  totalMarks: number
  description: string
  submissionCount?: number
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasImportedData, setHasImportedData] = useState(false)

  const loadImportedData = useCallback(() => {
    const data = localStorage.getItem('teachus_assignments')
    if (data) {
      const parsed = JSON.parse(data) as TeachUsAssignment[]
      const convertedAssignments: Assignment[] = parsed.map((item, index) => ({
        id: `imported_${index}`,
        title: item.title,
        description: item.description || `${item.subject} assignment`,
        dueDate: item.dueDate,
        createdAt: new Date().toISOString(),
        submissionsCount: item.submissionCount || 0,
        totalStudents: 30,
        totalMarks: item.totalMarks,
        subject: item.subject,
        status: new Date(item.dueDate) < new Date() ? 'closed' : 'published'
      }))

      setAssignments(convertedAssignments)
      setHasImportedData(convertedAssignments.length > 0)
    } else {
      setAssignments([])
      setHasImportedData(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadImportedData()

    // Listen for TeachUs data sync events
    const handleDataSync = (event: CustomEvent) => {
      if (event.detail.type === 'assignments') {
        loadImportedData()
      }
    }

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teachus_assignments') {
        loadImportedData()
      }
    }

    window.addEventListener('teachusDataSync', handleDataSync as EventListener)
    window.addEventListener('storage', handleStorageChange)

    // Poll for changes every 2 seconds (backup for same-tab updates)
    const interval = setInterval(loadImportedData, 2000)

    return () => {
      window.removeEventListener('teachusDataSync', handleDataSync as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [loadImportedData])

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilDue < 0) {
      return { text: `${Math.abs(daysUntilDue)}d overdue`, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/20' }
    } else if (daysUntilDue === 0) {
      return { text: 'Due today', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' }
    } else if (daysUntilDue <= 3) {
      return { text: `${daysUntilDue}d left`, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' }
    } else {
      return { text: `${daysUntilDue}d left`, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' }
    }
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (assignment.subject && assignment.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Get unique subjects
  const subjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))]

  // Calculate stats
  const totalMarks = assignments.reduce((sum, a) => sum + (a.totalMarks || 0), 0)
  const dueThisWeek = assignments.filter(a => {
    const due = new Date(a.dueDate)
    const now = new Date()
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 7
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Professional empty state
  if (!hasImportedData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track student assignments</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No Assignments Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Your assignment data will appear here automatically once you import it from the
                <span className="font-medium text-primary"> Import Data </span>
                section in the sidebar.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>Data syncs in real-time across all pages</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track student assignments</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          {assignments.length} Assignments Loaded
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
                <p className="text-sm text-blue-600/70 font-medium">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{assignments.filter(a => a.status === 'published').length}</p>
                <p className="text-sm text-green-600/70 font-medium">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{dueThisWeek}</p>
                <p className="text-sm text-orange-600/70 font-medium">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{totalMarks}</p>
                <p className="text-sm text-purple-600/70 font-medium">Total Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/10 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-600">{subjects.length}</p>
                <p className="text-sm text-cyan-600/70 font-medium">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search assignments by title or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => {
          const dueStatus = getDueDateStatus(assignment.dueDate)
          const submissionRate = Math.round((assignment.submissionsCount / assignment.totalStudents) * 100)

          return (
            <Card key={assignment.id} className="hover:shadow-lg transition-all hover:-translate-y-0.5">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                    {assignment.subject && (
                      <Badge variant="outline" className="mt-2 text-xs">{assignment.subject}</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">{assignment.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Due Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge className={`${dueStatus.bgColor} ${dueStatus.color} border-0`}>
                    {dueStatus.text}
                  </Badge>
                </div>

                {/* Total Marks */}
                {assignment.totalMarks && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">Total Marks</span>
                    </div>
                    <span className="text-sm font-semibold">{assignment.totalMarks}</span>
                  </div>
                )}

                {/* Submissions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">Submissions</span>
                    </div>
                    <span className="text-sm font-semibold">{assignment.submissionsCount}/{assignment.totalStudents}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 transition-all ${submissionRate >= 80 ? 'bg-green-500' :
                          submissionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${submissionRate}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Grade
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty Search State */}
      {filteredAssignments.length === 0 && searchQuery && (
        <Card className="text-center py-8">
          <CardContent>
            <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}