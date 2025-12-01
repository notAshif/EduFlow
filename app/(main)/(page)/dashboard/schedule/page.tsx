// app/dashboard/schedule/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock,
  Plus,
  Edit,
  Trash2,
  MapPin,
  User
} from 'lucide-react'

interface ClassSchedule {
  id: string
  classId: string
  className: string
  subject: string
  teacher: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
  color: string
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const dayColors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-pink-100']

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      // Mock data - replace with actual API call
      setSchedules([
        {
          id: '1',
          classId: 'math-101',
          className: 'Mathematics 101',
          subject: 'Mathematics',
          teacher: 'Dr. Smith',
          dayOfWeek: 1, // Monday
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 101',
          color: 'blue'
        },
        {
          id: '2',
          classId: 'science-101',
          className: 'Science 101',
          subject: 'Science',
          teacher: 'Prof. Johnson',
          dayOfWeek: 1, // Monday
          startTime: '11:00',
          endTime: '12:30',
          room: 'Lab 201',
          color: 'green'
        },
        {
          id: '3',
          classId: 'english-101',
          className: 'English 101',
          subject: 'English',
          teacher: 'Ms. Davis',
          dayOfWeek: 2, // Tuesday
          startTime: '09:00',
          endTime: '10:30',
          room: 'Room 102',
          color: 'yellow'
        },
        {
          id: '4',
          classId: 'history-101',
          className: 'History 101',
          subject: 'History',
          teacher: 'Mr. Wilson',
          dayOfWeek: 3, // Wednesday
          startTime: '14:00',
          endTime: '15:30',
          room: 'Room 103',
          color: 'purple'
        }
      ])
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSchedulesForDay = (dayIndex: number) => {
    return schedules
      .filter(schedule => schedule.dayOfWeek === dayIndex + 1)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
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
          <h1 className="text-3xl font-bold text-gray-900">Class Schedule</h1>
          <p className="text-gray-600 mt-1">View and manage your weekly class schedule</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {daysOfWeek.map((day, dayIndex) => {
          const daySchedules = getSchedulesForDay(dayIndex)
          
          return (
            <Card key={day} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className={`w-8 h-8 ${dayColors[dayIndex]} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-sm font-bold">
                      {day.charAt(0)}
                    </span>
                  </div>
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {daySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No classes scheduled</p>
                  </div>
                ) : (
                  daySchedules.map((schedule) => (
                    <div 
                      key={schedule.id}
                      className={`p-3 rounded-lg border border-gray-200 bg-${schedule.color}-50 hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {schedule.subject}
                        </Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm mb-1">{schedule.className}</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{schedule.teacher}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{schedule.room}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{schedules.length}</div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.subject)).size}
              </div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {new Set(schedules.map(s => s.teacher)).size}
              </div>
              <div className="text-sm text-gray-600">Teachers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {schedules.reduce((total, schedule) => {
                  const start = schedule.startTime.split(':')
                  const end = schedule.endTime.split(':')
                  const hours = (parseInt(end[0]) - parseInt(start[0])) + 
                              (parseInt(end[1]) - parseInt(start[1])) / 60
                  return total + hours
                }, 0).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}