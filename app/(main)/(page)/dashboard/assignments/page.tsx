// app/dashboard/assignments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Calendar,
  FileText,
  Users,
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
  attachments?: Array<{
    name: string
    url: string
  }>
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      // Mock data - replace with actual API call
      setAssignments([
        {
          id: 'assign_1',
          title: 'Introduction to Workflow Automation',
          description: 'Learn the basics of creating automated workflows for educational tasks.',
          dueDate: '2024-01-20T23:59:59Z',
          createdAt: '2024-01-10T10:00:00Z',
          submissionsCount: 12,
          totalStudents: 18,
          status: 'published',
          attachments: [
            { name: 'workflow-guide.pdf', url: '/files/workflow-guide.pdf' }
          ]
        },
        {
          id: 'assign_2',
          title: 'Advanced Integration Techniques',
          description: 'Explore advanced ways to integrate external services in your workflows.',
          dueDate: '2024-01-25T23:59:59Z',
          createdAt: '2024-01-12T14:30:00Z',
          submissionsCount: 8,
          totalStudents: 18,
          status: 'published'
        },
        {
          id: 'assign_3',
          title: 'Final Project - Build a Workflow',
          description: 'Create a complete workflow that automates a real educational scenario.',
          dueDate: '2024-01-30T23:59:59Z',
          createdAt: '2024-01-15T09:00:00Z',
          submissionsCount: 3,
          totalStudents: 18,
          status: 'draft'
        }
      ])
    } catch (error) {
      console.error('Failed to fetch assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      closed: 'outline'
    } as const
    
    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) {
      return { text: 'Overdue', color: 'text-red-600' }
    } else if (daysUntilDue <= 3) {
      return { text: `Due in ${daysUntilDue} days`, color: 'text-orange-600' }
    } else {
      return { text: `Due in ${daysUntilDue} days`, color: 'text-gray-600' }
    }
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">Manage student assignments and track submissions</p>
        </div>
        <Link href="/dashboard/assignments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search assignments..."
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
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                  {getStatusBadge(assignment.status)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Due Date */}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className={`text-sm font-medium ${dueStatus.color}`}>
                    {dueStatus.text}
                  </span>
                </div>

                {/* Submissions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {assignment.submissionsCount}/{assignment.totalStudents} submitted
                    </span>
                  </div>
                  <span className="text-sm font-medium">{submissionRate}%</span>
                </div>

                {/* Attachments */}
                {assignment.attachments && assignment.attachments.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {assignment.attachments.length} attachment{assignment.attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/dashboard/assignments/${assignment.id}`}>
                      View Details
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/assignments/${assignment.id}/edit`}>
                      Edit
                    </Link>
                  </Button>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500">
                  Created {new Date(assignment.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No assignments found' : 'No assignments yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first assignment to get started'
              }
            </p>
            {!searchQuery && (
              <Link href="/dashboard/assignments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}