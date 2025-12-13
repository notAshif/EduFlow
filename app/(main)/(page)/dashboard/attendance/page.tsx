// app/dashboard/attendance/page.tsx
'use client'

import React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  TrendingUp,
  FileSpreadsheet,
  Download,
  Building2,
  GraduationCap,
  User
} from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  division?: string
  semester?: string
}

interface TeachUsAttendance {
  studentId: string
  name: string
  date: string
  status: 'present' | 'absent' | 'late'
  subject: string
  lectureTime: string
}

interface CourseInfo {
  university: string
  department: string
  course: string
  term: string
  semester: string
  faculty: string
  createdOn: string
  creatorName: string
}

// Calculate attendance stats per student per subject
interface StudentAttendanceStats {
  studentId: string
  name: string
  subjects: {
    [subject: string]: {
      lecturesTaken: number
      lecturesAttended: number
      percentage: number
    }
  }
  overall: {
    lecturesTaken: number
    lecturesAttended: number
    percentage: number
  }
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
  const [viewMode, setViewMode] = useState<'spreadsheet' | 'list'>('spreadsheet')

  // Course information - loaded dynamically from localStorage
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    university: '',
    department: '',
    course: '',
    term: '',
    semester: '',
    faculty: '',
    createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    creatorName: ''
  })

  // Load imported data from localStorage
  const loadImportedData = useCallback(() => {
    // Load Course/College Info from localStorage
    const savedCourseInfo = localStorage.getItem('teachus_course_info')
    if (savedCourseInfo) {
      try {
        const parsedInfo = JSON.parse(savedCourseInfo)
        setCourseInfo(prev => ({
          ...prev,
          university: parsedInfo.university || '',
          department: parsedInfo.department || '',
          course: parsedInfo.course || '',
          term: parsedInfo.term || '',
          semester: parsedInfo.semester || '',
          faculty: parsedInfo.faculty || '',
          createdOn: parsedInfo.createdOn || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          creatorName: parsedInfo.creatorName || ''
        }))
      } catch (e) {
        console.log('Error parsing course info:', e)
      }
    }

    // Load Students
    const studentsData = localStorage.getItem('teachus_students')
    let importedStudents: Student[] = []

    if (studentsData) {
      const parsedStudents = JSON.parse(studentsData)
      importedStudents = parsedStudents.map((s: any) => ({
        id: s.rollNo || s.studentId || `STU-${Math.random().toString(36).substr(2, 9)}`,
        name: s.name,
        email: s.email || `${s.name.toLowerCase().replace(' ', '.')}@college.edu`,
        studentId: s.rollNo || s.studentId || 'Unknown',
        division: s.division || 'A',
        semester: s.semester || '1'
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
    setHasImportedData(importedStudents.length > 0 || (attendanceData ? JSON.parse(attendanceData).length > 0 : false))
    setLoading(false)
  }, [])

  useEffect(() => {
    loadImportedData()

    const handleDataSync = (event: CustomEvent) => {
      if (event.detail.type === 'attendance' || event.detail.type === 'students' || event.detail.type === 'course_info') {
        loadImportedData()
      }
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'teachus_attendance' || e.key === 'teachus_students' || e.key === 'teachus_course_info') {
        loadImportedData()
      }
    }

    window.addEventListener('teachusDataSync', handleDataSync as EventListener)
    window.addEventListener('storage', handleStorageChange)
    const interval = setInterval(loadImportedData, 2000)

    return () => {
      window.removeEventListener('teachusDataSync', handleDataSync as EventListener)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [loadImportedData])

  // Get unique subjects from imported data
  const subjects = useMemo(() => [...new Set(importedData.map(r => r.subject))], [importedData])

  // Calculate student attendance stats per subject
  const studentStats = useMemo((): StudentAttendanceStats[] => {
    const statsMap = new Map<string, StudentAttendanceStats>()

    // Initialize stats for all students
    students.forEach(student => {
      const subjectsStats: StudentAttendanceStats['subjects'] = {}
      subjects.forEach(subject => {
        subjectsStats[subject] = { lecturesTaken: 0, lecturesAttended: 0, percentage: 0 }
      })
      statsMap.set(student.id, {
        studentId: student.studentId,
        name: student.name,
        subjects: subjectsStats,
        overall: { lecturesTaken: 0, lecturesAttended: 0, percentage: 0 }
      })
    })

    // Calculate lectures taken per subject (total unique dates per subject)
    const lecturesPerSubject: { [subject: string]: Set<string> } = {}
    subjects.forEach(subject => {
      lecturesPerSubject[subject] = new Set()
    })
    importedData.forEach(record => {
      if (lecturesPerSubject[record.subject]) {
        lecturesPerSubject[record.subject].add(record.date)
      }
    })

    // Process attendance records
    importedData.forEach(record => {
      const stats = statsMap.get(record.studentId)
      if (stats && stats.subjects[record.subject]) {
        stats.subjects[record.subject].lecturesTaken = lecturesPerSubject[record.subject].size
        if (record.status === 'present' || record.status === 'late') {
          stats.subjects[record.subject].lecturesAttended++
        }
      }
    })

    // Calculate percentages and overall stats
    statsMap.forEach((stats) => {
      let totalTaken = 0
      let totalAttended = 0

      Object.values(stats.subjects).forEach(subjectStats => {
        if (subjectStats.lecturesTaken > 0) {
          subjectStats.percentage = Math.round((subjectStats.lecturesAttended / subjectStats.lecturesTaken) * 100)
        }
        totalTaken += subjectStats.lecturesTaken
        totalAttended += subjectStats.lecturesAttended
      })

      stats.overall.lecturesTaken = totalTaken
      stats.overall.lecturesAttended = totalAttended
      stats.overall.percentage = totalTaken > 0 ? Math.round((totalAttended / totalTaken) * 100) : 0
    })

    return Array.from(statsMap.values())
  }, [students, importedData, subjects])

  // Get color based on percentage (TeachUs style)
  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 75) return 'bg-green-500 text-white'
    if (percentage >= 55) return 'bg-yellow-400 text-black'
    if (percentage >= 40) return 'bg-orange-400 text-black'
    if (percentage >= 20) return 'bg-orange-300 text-black'
    return 'bg-red-500 text-white'
  }

  const getPercentageBgColor = (percentage: number): string => {
    if (percentage >= 75) return '#22c55e'
    if (percentage >= 55) return '#facc15'
    if (percentage >= 40) return '#fb923c'
    if (percentage >= 20) return '#fdba74'
    return '#ef4444'
  }

  // Filter students based on search
  const filteredStats = studentStats.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Export to CSV function
  const exportToCSV = () => {
    let csv = 'Roll Number,Full Name'
    subjects.forEach(subject => {
      csv += `,${subject} - Lectures Taken,${subject} - Lectures Attended,${subject} - %`
    })
    csv += ',Total Lectures,Total Attended,Overall %\n'

    filteredStats.forEach(stat => {
      csv += `${stat.studentId},"${stat.name}"`
      subjects.forEach(subject => {
        const subjectStat = stat.subjects[subject]
        csv += `,${subjectStat.lecturesTaken},${subjectStat.lecturesAttended},${subjectStat.percentage}%`
      })
      csv += `,${stat.overall.lecturesTaken},${stat.overall.lecturesAttended},${stat.overall.percentage}%\n`
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Overall attendance rate
  const overallStats = {
    total: importedData.length,
    present: importedData.filter(r => r.status === 'present').length,
    absent: importedData.filter(r => r.status === 'absent').length,
    late: importedData.filter(r => r.status === 'late').length,
  }
  const attendanceRate = overallStats.total > 0
    ? Math.round(((overallStats.present + overallStats.late) / overallStats.total) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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
      {/* TeachUs Style Spreadsheet View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Spreadsheet Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Header Section - University & Course Info */}
              <div className="bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800 w-32">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          University
                        </div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={2}>
                        {courseInfo.university || <span className="text-gray-400 italic">Set in Import → College Info</span>}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800 w-24">
                        Dept
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={3}>
                        {courseInfo.department || <span className="text-gray-400 italic">Set in Import → College Info</span>}
                      </td>
                      {/* Legend */}
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-semibold bg-gray-100 dark:bg-gray-800 text-center" rowSpan={6}>
                        <div className="space-y-1">
                          <div className="font-bold mb-2">Legend</div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded bg-green-500"></span>
                            <span>≥75.0%: Satisfactory</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded bg-yellow-400"></span>
                            <span>55-74.99%: Unsatisfactory</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded bg-orange-400"></span>
                            <span>40-54.99%: Moderate</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded bg-orange-300"></span>
                            <span>20-39.99%: Very Moderate</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-4 h-4 rounded bg-red-500"></span>
                            <span>&lt;20%: Very Very Moderate</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-gray-500" />
                          Course
                        </div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={2}>
                        {courseInfo.course || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        Term
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={3}>
                        {courseInfo.term || <span className="text-gray-400 italic">-</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        Semester
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={2}>
                        {courseInfo.semester || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        Semester
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={3}>
                        {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          Faculty
                        </div>
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={2}>
                        {courseInfo.faculty || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        Created On
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={3}>
                        {courseInfo.createdOn}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5 font-medium bg-gray-50 dark:bg-gray-800">
                        Creator Name
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 px-3 py-1.5" colSpan={6}>
                        {courseInfo.creatorName || <span className="text-gray-400 italic">Set in Import → College Info</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Spacer row */}
              <div className="h-4 bg-gray-100 dark:bg-gray-800"></div>

              {/* Main Attendance Table */}
              <div className="bg-white dark:bg-gray-900">
                <table className="w-full border-collapse text-sm">
                  {/* Table Header - Row 1: Lecture of Name/Date Range */}
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold w-8" rowSpan={3}>
                        #
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold w-28" rowSpan={3}>
                        Roll Number
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold w-48" rowSpan={3}>
                        Full Name
                      </th>
                      {subjects.length > 0 && (
                        <>
                          <th
                            className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold bg-blue-50 dark:bg-blue-950/30"
                            colSpan={subjects.length * 3}
                          >
                            Lecture of Name
                          </th>
                          <th
                            className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold bg-green-50 dark:bg-green-950/30"
                            colSpan={3}
                          >
                            Anil Sir Data Range
                          </th>
                        </>
                      )}
                    </tr>
                    {/* Row 2: Subject Names */}
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      {subjects.map((subject, idx) => (
                        <th
                          key={subject}
                          className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold bg-blue-50 dark:bg-blue-950/30"
                          colSpan={3}
                        >
                          <div className="flex flex-col items-center">
                            <span>{subject}</span>
                            <span className="text-xs font-normal text-gray-500">
                              {studentStats[0]?.subjects[subject]?.lecturesTaken || 0} lectures
                            </span>
                          </div>
                        </th>
                      ))}
                      <th
                        className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-semibold bg-green-50 dark:bg-green-950/30"
                        colSpan={3}
                      >
                        <div className="flex flex-col items-center">
                          <span>Field Section/ce</span>
                          <span className="text-xs font-normal text-gray-500">Overall</span>
                        </div>
                      </th>
                    </tr>
                    {/* Row 3: Lectures Taken / Attended / % */}
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      {subjects.map(subject => (
                        <React.Fragment key={`header-${subject}`}>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium">
                            Lectures Taken
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium">
                            Lectures Attended
                          </th>
                          <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium">
                            %
                          </th>
                        </React.Fragment>
                      ))}
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium bg-green-50 dark:bg-green-950/30">
                        Lectures Taken
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium bg-green-50 dark:bg-green-950/30">
                        Lectures Attended
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-2 py-1.5 text-center text-xs font-medium bg-green-50 dark:bg-green-950/30">
                        %
                      </th>
                    </tr>
                  </thead>
                  {/* Table Body - Student Rows */}
                  <tbody>
                    {filteredStats.map((stat, index) => (
                      <tr
                        key={stat.studentId}
                        className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors`}
                      >
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium">
                          {stat.studentId}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                          {stat.name}
                        </td>
                        {subjects.map(subject => {
                          const subjectStat = stat.subjects[subject]
                          return (
                            <React.Fragment key={`${stat.studentId}-${subject}`}>
                              <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                                {subjectStat.lecturesTaken}
                              </td>
                              <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center">
                                {subjectStat.lecturesAttended}
                              </td>
                              <td
                                className={`border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold ${getPercentageColor(subjectStat.percentage)}`}
                              >
                                {subjectStat.percentage}%
                              </td>
                            </React.Fragment>
                          )
                        })}
                        {/* Overall Stats */}
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center bg-green-50 dark:bg-green-950/10">
                          {stat.overall.lecturesTaken}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center bg-green-50 dark:bg-green-950/10">
                          {stat.overall.lecturesAttended}
                        </td>
                        <td
                          className={`border border-gray-300 dark:border-gray-600 px-2 py-2 text-center font-semibold ${getPercentageColor(stat.overall.percentage)}`}
                        >
                          {stat.overall.percentage}%
                        </td>
                      </tr>
                    ))}
                    {/* Empty rows for visual consistency */}
                    {Array.from({ length: Math.max(0, 10 - filteredStats.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className={`${(filteredStats.length + idx) % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-400">
                          {filteredStats.length + idx + 1}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"></td>
                        <td className="border border-gray-300 dark:border-gray-600 px-3 py-2"></td>
                        {subjects.map(subject => (
                          <React.Fragment key={`empty-${idx}-${subject}`}>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-2"></td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-2"></td>
                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-2"></td>
                          </React.Fragment>
                        ))}
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 bg-green-50 dark:bg-green-950/10"></td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 bg-green-50 dark:bg-green-950/10"></td>
                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2 bg-green-50 dark:bg-green-950/10"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                {filteredStats.length} Students
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {attendanceRate}% Overall Attendance
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={loadImportedData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Cards */}
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
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{subjects.length}</p>
            <p className="text-sm text-purple-600/70 dark:text-purple-400/70 font-medium">Subjects</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}