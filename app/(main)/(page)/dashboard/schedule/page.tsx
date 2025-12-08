// app/dashboard/schedule/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  BookOpen,
  TrendingUp
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

interface TeachUsSchedule {
  day: string
  subject: string
  time: string
  room: string
  teacher: string
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const dayColors = [
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-green-100 dark:bg-green-900/30',
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-orange-100 dark:bg-orange-900/30'
]

const subjectColors: Record<string, string> = {
  'mathematics': 'blue',
  'physics': 'green',
  'chemistry': 'yellow',
  'biology': 'emerald',
  'english': 'purple',
  'history': 'pink',
  'geography': 'cyan',
  'computer': 'indigo',
  'economics': 'orange',
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [hasImportedData, setHasImportedData] = useState(false)

  const getDayNumber = (day: string): number => {
    const dayMap: Record<string, number> = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 7
    }
    return dayMap[day.toLowerCase()] || 1
  }

  const parseTimeRange = (timeStr: string): { start: string; end: string } => {
    const parts = timeStr.split(/[-–]/).map(s => s.trim())

    const convertTo24h = (time: string): string => {
      const match = time.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i)
      if (!match) return '09:00'

      let hours = parseInt(match[1])
      const minutes = match[2] || '00'
      const period = match[3]?.toUpperCase()

      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0

      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }

    return {
      start: convertTo24h(parts[0]),
      end: parts[1] ? convertTo24h(parts[1]) : convertTo24h(parts[0])
    }
  }

  const getSubjectColor = (subject: string): string => {
    const subjectLower = subject.toLowerCase()
    for (const [key, color] of Object.entries(subjectColors)) {
      if (subjectLower.includes(key)) return color
    }
    return 'gray'
  }

  const loadImportedData = useCallback(() => {
    const data = localStorage.getItem('teachus_schedule')
    if (data) {
      const parsed = JSON.parse(data) as TeachUsSchedule[]
      const convertedSchedules: ClassSchedule[] = parsed.map((item, index) => {
        const times = parseTimeRange(item.time)
        return {
          id: `imported_${index}`,
          classId: `class_${index}`,
          className: item.subject,
          subject: item.subject,
          teacher: item.teacher,
          dayOfWeek: getDayNumber(item.day),
          startTime: times.start,
          endTime: times.end,
          room: item.room,
          color: getSubjectColor(item.subject)
        }
      })

      setSchedules(convertedSchedules)
      setHasImportedData(convertedSchedules.length > 0)
    } else {
      setSchedules([])
      setHasImportedData(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadImportedData()

    // Listen for TeachUs data sync events
    const handleDataSync = (event: CustomEvent) => {
      if (event.detail.type === 'schedule') {
        loadImportedData()
      }
    }

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teachus_schedule') {
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

  const getTodayIndex = () => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1
  }

  // Get unique teachers and subjects
  const teachers = [...new Set(schedules.map(s => s.teacher))]
  const subjects = [...new Set(schedules.map(s => s.subject))]

  // Calculate total hours
  const totalHours = schedules.reduce((total, schedule) => {
    const start = schedule.startTime.split(':')
    const end = schedule.endTime.split(':')
    const hours = (parseInt(end[0]) - parseInt(start[0])) +
      (parseInt(end[1]) - parseInt(start[1])) / 60
    return total + Math.max(0, hours)
  }, 0)

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Class Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your weekly class timetable</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No Schedule Data Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Your class schedule will appear here automatically once you import it from the
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

  const todaySchedules = getSchedulesForDay(getTodayIndex())

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Class Schedule</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your weekly class timetable</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          {schedules.length} Classes Loaded
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
                <p className="text-sm text-blue-600/70 font-medium">Classes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{subjects.length}</p>
                <p className="text-sm text-purple-600/70 font-medium">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{teachers.length}</p>
                <p className="text-sm text-green-600/70 font-medium">Teachers</p>
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
                <p className="text-2xl font-bold text-orange-600">{totalHours.toFixed(1)}h</p>
                <p className="text-sm text-orange-600/70 font-medium">Weekly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Classes */}
      {todaySchedules.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Classes — {daysOfWeek[getTodayIndex()]}
              <Badge variant="default" className="ml-2">{todaySchedules.length} classes</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {todaySchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 bg-background rounded-xl border shadow-sm hover:shadow-md transition-all"
                >
                  <Badge variant="outline" className="mb-3">{schedule.subject}</Badge>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-foreground">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{schedule.room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{schedule.teacher}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {daysOfWeek.map((day, dayIndex) => {
          const daySchedules = getSchedulesForDay(dayIndex)
          const isToday = dayIndex === getTodayIndex()

          return (
            <Card key={day} className={`h-fit ${isToday ? 'ring-2 ring-primary shadow-lg' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className={`w-10 h-10 ${dayColors[dayIndex]} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <span className="text-sm font-bold">{day.charAt(0)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className={isToday ? 'text-primary font-semibold' : ''}>{day}</span>
                    {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-normal mt-1">
                    {daySchedules.length} class{daySchedules.length !== 1 ? 'es' : ''}
                  </p>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {daySchedules.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No classes</p>
                  </div>
                ) : (
                  daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Badge variant="outline" className="text-xs mb-2">{schedule.subject}</Badge>
                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium text-foreground">
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3 h-3" />
                          <span>{schedule.teacher}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
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
    </div>
  )
}