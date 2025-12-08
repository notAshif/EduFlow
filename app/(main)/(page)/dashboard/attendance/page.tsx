// app/dashboard/attendance/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  BarChart3,
  TrendingUp
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
}

interface TeachUsAttendance {
  studentId: string
  name: string
  date: string
  status: 'present' | 'absent' | 'late'
  subject: string
  lectureTime: string
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [importedData, setImportedData] = useState<TeachUsAttendance[]>([])
  const [hasImportedData, setHasImportedData] = useState(false)

  // Load imported data from localStorage
  const loadImportedData = useCallback(() => {
    // Load Students
    const studentsData = localStorage.getItem('teachus_students')
    let importedStudents: Student[] = []

    if (studentsData) {
      const parsedStudents = JSON.parse(studentsData)
      importedStudents = parsedStudents.map((s: any) => ({
        id: s.rollNo || s.studentId || `STU-${Math.random().toString(36).substr(2, 9)}`,
        name: s.name,
        email: s.email || `${s.name.toLowerCase().replace(' ', '.')}@college.edu`,
        studentId: s.rollNo || s.studentId || 'Unknown'
      }))
    }

    // Load Attendance History
    const attendanceData = localStorage.getItem('teachus_attendance')
    if (attendanceData) {
      const parsed = JSON.parse(attendanceData) as TeachUsAttendance[]
      setImportedData(parsed)

      // If no students explicitly imported, derive from attendance
      if (importedStudents.length === 0) {
        const uniqueStudents = new Map<string, Student>()
        parsed.forEach((record) => {
          if (!uniqueStudents.has(record.studentId)) {
            uniqueStudents.set(record.studentId, {
              id: record.studentId,
              name: record.name,
              email: `${record.name.toLowerCase().replace(' ', '.')}@college.edu`,
              studentId: record.studentId
            })
          }
        })
        importedStudents = Array.from(uniqueStudents.values())
      }
    }

    setStudents(importedStudents)
    // We have data if we have students OR attendance records
    setHasImportedData(importedStudents.length > 0 || (attendanceData ? JSON.parse(attendanceData).length > 0 : false))

    setLoading(false)
  }, [])

  useEffect(() => {
    loadImportedData()

    // Listen for TeachUs data sync events
    const handleDataSync = (event: CustomEvent) => {
      if (event.detail.type === 'attendance' || event.detail.type === 'students') {
        loadImportedData()
      }
    }

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teachus_attendance' || e.key === 'teachus_students') {
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

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSaveAttendance = async () => {
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => {
        const student = students.find(s => s.id === studentId)
        return {
          studentId,
          name: student?.name || 'Unknown',
          date: selectedDate,
          status: status as 'present' | 'absent' | 'late',
          subject: selectedClass || 'General',
          lectureTime: new Date().toLocaleTimeString()
        }
      })

      // Merge with existing imported data
      const existingData = [...importedData]
      records.forEach(newRecord => {
        const index = existingData.findIndex(
          r => r.studentId === newRecord.studentId && r.date === newRecord.date
        )
        if (index >= 0) {
          existingData[index] = newRecord
        } else {
          existingData.push(newRecord)
        }
      })

      // Save to localStorage
      localStorage.setItem('teachus_attendance', JSON.stringify(existingData))
      setImportedData(existingData)
      setHasImportedData(true)

      // Reset form
      setAttendanceRecords({})
      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('Failed to save attendance')
    }
  }

  // Auto-fill from imported data for selected date
  const autoFillFromImport = () => {
    const dateRecords = importedData.filter(r => r.date === selectedDate)
    if (dateRecords.length === 0) {
      alert('No imported records found for this date')
      return
    }

    const newRecords: Record<string, string> = {}
    dateRecords.forEach(record => {
      newRecords[record.studentId] = record.status
    })
    setAttendanceRecords(newRecords)
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique dates from imported data
  const importedDates = [...new Set(importedData.map(r => r.date))].sort().reverse()

  // Get attendance records grouped by date
  const importedRecordsByDate = importedData.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = { total: 0, present: 0, absent: 0, late: 0 }
    }
    acc[record.date].total++
    acc[record.date][record.status]++
    return acc
  }, {} as Record<string, { total: number; present: number; absent: number; late: number }>)

  // Get unique subjects from imported data
  const subjects = [...new Set(importedData.map(r => r.subject))]

  // Calculate overall attendance rate
  const overallStats = {
    total: importedData.length,
    present: importedData.filter(r => r.status === 'present').length,
    absent: importedData.filter(r => r.status === 'absent').length,
    late: importedData.filter(r => r.status === 'late').length,
  }
  const attendanceRate = overallStats.total > 0
    ? Math.round((overallStats.present / overallStats.total) * 100)
    : 0

  const attendanceStats = {
    total: students.length,
    present: Object.values(attendanceRecords).filter(status => status === 'present').length,
    absent: Object.values(attendanceRecords).filter(status => status === 'absent').length,
    late: Object.values(attendanceRecords).filter(status => status === 'late').length,
    excused: Object.values(attendanceRecords).filter(status => status === 'excused').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show professional empty state if no data
  if (!hasImportedData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage student attendance records</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No Attendance Records Yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Your attendance data will appear here automatically once you import it from the
                <span className="font-medium text-primary"> Import Data </span>
                section in the sidebar.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage student attendance records</p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          {importedData.length} Records • {attendanceRate}% Attendance Rate
        </Badge>
      </div>

      {/* Stats from Imported Data */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{students.length}</p>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">Students</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{overallStats.present}</p>
            <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">Present</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/10 border-red-200 dark:border-red-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{overallStats.absent}</p>
            <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">Absent</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{overallStats.late}</p>
            <p className="text-sm text-orange-600/70 dark:text-orange-400/70 font-medium">Late</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{importedDates.length}</p>
            <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Mark New Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mark Attendance</span>
            {importedDates.includes(selectedDate) && (
              <Button size="sm" variant="outline" onClick={autoFillFromImport}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Load Imported Data
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Subject/Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats for Current Session */}
          {Object.keys(attendanceRecords).length > 0 && (
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xl font-bold">{attendanceStats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600">{attendanceStats.present}</p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-red-600">{attendanceStats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-orange-600">{attendanceStats.late}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium dark:text-gray-100">{student.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.studentId}</div>
                  </div>
                </div>
                <Select
                  value={attendanceRecords[student.id] || ''}
                  onValueChange={(value) => handleStatusChange(student.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        Present
                      </span>
                    </SelectItem>
                    <SelectItem value="absent">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-600" />
                        Absent
                      </span>
                    </SelectItem>
                    <SelectItem value="late">
                      <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-orange-600" />
                        Late
                      </span>
                    </SelectItem>
                    <SelectItem value="excused">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-blue-600" />
                        Excused
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveAttendance}
              disabled={Object.keys(attendanceRecords).length === 0}
            >
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Imported Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(importedRecordsByDate).slice(0, 10).map(([date, stats]) => {
              const rate = Math.round((stats.present / stats.total) * 100)
              return (
                <div key={date} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium dark:text-gray-100">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          {stats.present}
                        </span>
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-600" />
                          {stats.absent}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-orange-600" />
                          {stats.late}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}>
                    {rate}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}