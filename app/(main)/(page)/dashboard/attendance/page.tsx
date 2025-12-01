// app/dashboard/attendance/page.tsx
'use client'

import { useState, useEffect } from 'react'
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
  AlertCircle
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
}

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      // Mock data - replace with actual API call
      setStudents([
        { id: '1', name: 'Alice Johnson', email: 'alice@demo.edu', studentId: 'STU001' },
        { id: '2', name: 'Bob Smith', email: 'bob@demo.edu', studentId: 'STU002' },
        { id: '3', name: 'Charlie Brown', email: 'charlie@demo.edu', studentId: 'STU003' },
        { id: '4', name: 'Diana Prince', email: 'diana@demo.edu', studentId: 'STU004' },
        { id: '5', name: 'Edward Norton', email: 'edward@demo.edu', studentId: 'STU005' },
        { id: '6', name: 'Fiona Green', email: 'fiona@demo.edu', studentId: 'STU006' },
        { id: '7', name: 'George Wilson', email: 'george@demo.edu', studentId: 'STU007' },
        { id: '8', name: 'Hannah Lee', email: 'hannah@demo.edu', studentId: 'STU008' },
      ])
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleSaveAttendance = async () => {
    setLoading(true)
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        date: selectedDate,
        status,
        classId: selectedClass
      }))

      // API call to save attendance
      console.log('Saving attendance records:', records)
      
      // Reset form
      setAttendanceRecords({})
      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Failed to save attendance:', error)
      alert('Failed to save attendance')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      present: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      absent: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      late: { variant: 'secondary' as const, icon: Clock, color: 'text-orange-600' },
      excused: { variant: 'outline' as const, icon: AlertCircle, color: 'text-blue-600' }
    }
    
    const config = variants[status as keyof typeof variants] || variants.present
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <config.icon className="w-3 h-3" />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    )
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const attendanceStats = {
    total: students.length,
    present: Object.values(attendanceRecords).filter(status => status === 'present').length,
    absent: Object.values(attendanceRecords).filter(status => status === 'absent').length,
    late: Object.values(attendanceRecords).filter(status => status === 'late').length,
    excused: Object.values(attendanceRecords).filter(status => status === 'excused').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">Mark and track student attendance</p>
      </div>

      {/* Attendance Form */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
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
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math-101">Mathematics 101</SelectItem>
                  <SelectItem value="science-101">Science 101</SelectItem>
                  <SelectItem value="english-101">English 101</SelectItem>
                  <SelectItem value="history-101">History 101</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {Object.keys(attendanceRecords).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{attendanceStats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                <div className="text-sm text-gray-600">Present</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{attendanceStats.late}</div>
                <div className="text-sm text-gray-600">Late</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.excused}</div>
                <div className="text-sm text-gray-600">Excused</div>
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.studentId} • {student.email}</div>
                  </div>
                </div>
                <Select 
                  value={attendanceRecords[student.id] || ''} 
                  onValueChange={(value) => handleStatusChange(student.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveAttendance}
              disabled={Object.keys(attendanceRecords).length === 0 || loading}
            >
              {loading ? 'Saving...' : 'Save Attendance'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium">Mathematics 101</div>
                  <div className="text-sm text-gray-500">January 15, 2024</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">18/20 present</span>
                <Badge variant="default">90%</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium">Science 101</div>
                  <div className="text-sm text-gray-500">January 14, 2024</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">16/20 present</span>
                <Badge variant="secondary">80%</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}