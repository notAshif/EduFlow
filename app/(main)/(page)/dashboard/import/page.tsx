// app/(main)/(page)/dashboard/import/page.tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Upload,
    FileText,
    Download,
    CheckCircle,
    XCircle,
    AlertCircle,
    Users,
    Calendar,
    FileSpreadsheet,
    Loader2,
    RefreshCw,
    HelpCircle,
    ExternalLink,
    Building2,
    GraduationCap,
    Save,
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { useToast } from '@/hooks/use-toast'

// Course/College Info interface
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

interface ImportResult {
    success: boolean
    type: 'attendance' | 'assignments' | 'schedule' | 'students'
    recordsImported: number
    errors: string[]
    data: any[]
}

interface TeachUsAttendance {
    studentId: string
    name: string
    date: string
    status: 'present' | 'absent' | 'late'
    subject: string
    lectureTime: string
}

interface TeachUsAssignment {
    title: string
    subject: string
    dueDate: string
    totalMarks: number
    description: string
    submissionCount?: number
}

interface TeachUsSchedule {
    day: string
    subject: string
    time: string
    room: string
    teacher: string
}

interface TeachUsStudent {
    rollNo: string
    name: string
    email: string
    phone: string
    division: string
    semester: string
}

export default function ImportPage() {
    const [activeTab, setActiveTab] = useState('attendance')
    const [importing, setImporting] = useState(false)
    const [importResults, setImportResults] = useState<ImportResult | null>(null)
    const [previewData, setPreviewData] = useState<any[]>([])
    const [storedCounts, setStoredCounts] = useState<Record<string, number>>({})
    const { toast } = useToast()

    // Course/College Info state
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

    // Load stored counts and course info on mount
    useEffect(() => {
        const counts: Record<string, number> = {}
        const types = ['attendance', 'assignments', 'schedule', 'students']
        types.forEach(type => {
            const data = localStorage.getItem(`teachus_${type}`)
            counts[type] = data ? JSON.parse(data).length : 0
        })
        setStoredCounts(counts)

        // Load course info from localStorage
        const savedCourseInfo = localStorage.getItem('teachus_course_info')
        if (savedCourseInfo) {
            try {
                setCourseInfo(JSON.parse(savedCourseInfo))
            } catch (e) {
                console.log('Error loading course info:', e)
            }
        }
    }, [importResults])

    // Save course info to localStorage
    const saveCourseInfo = () => {
        localStorage.setItem('teachus_course_info', JSON.stringify(courseInfo))
        // Broadcast update
        window.dispatchEvent(new CustomEvent('teachusDataSync', {
            detail: { type: 'course_info', data: courseInfo }
        }))
        toast({
            title: "College Info Saved! ✅",
            description: "Your college information has been saved and will appear in attendance reports.",
        })
    }

    // Update course info field
    const updateCourseInfo = (field: keyof CourseInfo, value: string) => {
        setCourseInfo(prev => ({ ...prev, [field]: value }))
    }

    // Parse CSV and extract metadata from first rows (TeachUs format)
    const parseCSVWithMetadata = (file: File): Promise<{ data: any[], metadata: CourseInfo }> => {
        return new Promise((resolve, reject) => {
            // First, read the raw file to extract metadata from first rows
            const reader = new FileReader()
            reader.onload = (e) => {
                const text = e.target?.result as string
                const lines = text.split(/\r?\n/)

                // Extract metadata from first 6-10 rows that contain key-value pairs
                const extractedInfo: Partial<CourseInfo> = {
                    createdOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                }

                // Look for metadata patterns in first 10 rows
                for (let i = 0; i < Math.min(10, lines.length); i++) {
                    const line = lines[i].toLowerCase()
                    const cells = lines[i].split(',').map(c => c.trim().replace(/"/g, ''))

                    // Check each cell for labels
                    for (let j = 0; j < cells.length - 1; j++) {
                        const label = cells[j].toLowerCase().trim()
                        const value = cells[j + 1]?.trim() || ''

                        if ((label.includes('university') || label === 'university') && value) {
                            extractedInfo.university = value
                        }
                        if ((label.includes('dept') || label === 'department' || label === 'dept') && value) {
                            extractedInfo.department = value
                        }
                        if ((label.includes('course') || label === 'course') && value && !label.includes('semester')) {
                            extractedInfo.course = value
                        }
                        if ((label.includes('term') || label === 'term') && value) {
                            extractedInfo.term = value
                        }
                        if ((label.includes('semester') || label === 'semester' || label === 'sem') && value) {
                            extractedInfo.semester = value
                        }
                        if ((label.includes('faculty') || label === 'faculty' || label.includes('teacher')) && value) {
                            extractedInfo.faculty = value
                        }
                        if ((label.includes('created') || label === 'created on' || label === 'createdon') && value) {
                            extractedInfo.createdOn = value
                        }
                        if ((label.includes('creator') || label === 'creator name' || label.includes('creatorname')) && value) {
                            extractedInfo.creatorName = value
                        }
                    }
                }

                console.log('Extracted metadata from CSV:', extractedInfo)

                // Now parse the actual data rows with PapaParse
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim(),
                    complete: (results) => {
                        console.log('Parsed CSV headers:', Object.keys(results.data[0] || {}))
                        console.log('Sample row:', results.data[0])
                        resolve({
                            data: results.data,
                            metadata: extractedInfo as CourseInfo
                        })
                    },
                    error: (error) => {
                        reject(error)
                    }
                })
            }
            reader.onerror = () => reject(new Error('Failed to read file'))
            reader.readAsText(file)
        })
    }

    const parseCSV = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim(),
                complete: (results) => {
                    console.log('Parsed CSV headers:', Object.keys(results.data[0] || {}))
                    console.log('Sample row:', results.data[0])
                    resolve(results.data)
                },
                error: (error) => {
                    reject(error)
                }
            })
        })
    }

    const detectDataType = (data: any[]): 'attendance' | 'assignments' | 'schedule' | 'students' | 'unknown' => {
        if (data.length === 0) return 'unknown'

        const headers = Object.keys(data[0]).map(h => h.toLowerCase().trim())
        console.log('Detecting data type from headers:', headers)

        // Detect attendance data - look for common attendance patterns
        if (headers.some(h =>
            h.includes('present') ||
            h.includes('absent') ||
            h.includes('attendance') ||
            h.includes('status') ||
            (h.includes('date') && headers.some(h2 => h2.includes('name') || h2.includes('roll')))
        )) {
            return 'attendance'
        }

        // Detect assignment data
        if (headers.some(h =>
            h.includes('assignment') ||
            h.includes('marks') ||
            h.includes('submission') ||
            h.includes('due') ||
            h.includes('deadline')
        )) {
            return 'assignments'
        }

        // Detect schedule data
        if (headers.some(h =>
            h.includes('lecture') ||
            h.includes('timetable') ||
            h.includes('slot') ||
            h.includes('day') ||
            h.includes('monday') ||
            h.includes('tuesday')
        )) {
            return 'schedule'
        }

        // Detect student data
        if (headers.some(h =>
            h.includes('roll') ||
            h.includes('enrollment') ||
            h.includes('student') ||
            h.includes('email') ||
            h.includes('phone')
        )) {
            return 'students'
        }

        return 'unknown'
    }

    const findValue = (row: any, ...keys: string[]): string => {
        for (const key of keys) {
            // Check exact match
            if (row[key] !== undefined && row[key] !== '') return String(row[key])

            // Check case-insensitive match
            const rowKeys = Object.keys(row)
            for (const rowKey of rowKeys) {
                if (rowKey.toLowerCase().trim() === key.toLowerCase()) {
                    if (row[rowKey] !== undefined && row[rowKey] !== '') {
                        return String(row[rowKey])
                    }
                }
                // Check if key contains the search term
                if (rowKey.toLowerCase().includes(key.toLowerCase())) {
                    if (row[rowKey] !== undefined && row[rowKey] !== '') {
                        return String(row[rowKey])
                    }
                }
            }
        }
        return ''
    }

    const normalizeAttendanceData = (data: any[]): TeachUsAttendance[] => {
        return data.map((row, index) => {
            const headers = Object.keys(row)
            console.log(`Processing row ${index}:`, row)

            // Try various column name patterns
            const studentId = findValue(row, 'Roll No', 'Roll', 'Student ID', 'ID', 'Enrollment No', 'Enrollment', 'RollNo', 'StudentID') ||
                (headers[0] ? row[headers[0]] : `STU${index + 1}`)

            const name = findValue(row, 'Name', 'Student Name', 'Full Name', 'StudentName', 'Student') || 'Unknown'

            const date = findValue(row, 'Date', 'Lecture Date', 'AttendanceDate', 'Attendance Date') ||
                new Date().toISOString().split('T')[0]

            const statusRaw = findValue(row, 'Status', 'Attendance', 'Present', 'AttendanceStatus') || 'present'
            let status: 'present' | 'absent' | 'late' = 'present'
            if (statusRaw.toLowerCase().includes('absent') || statusRaw === '0' || statusRaw.toLowerCase() === 'a') {
                status = 'absent'
            } else if (statusRaw.toLowerCase().includes('late') || statusRaw.toLowerCase() === 'l') {
                status = 'late'
            }

            const subject = findValue(row, 'Subject', 'Course', 'Lecture', 'Class', 'SubjectName') || 'General'

            const lectureTime = findValue(row, 'Time', 'Lecture Time', 'Slot', 'Period', 'LectureTime') || '09:00 AM'

            return { studentId, name, date, status, subject, lectureTime }
        }).filter(item => item.name !== 'Unknown' || item.studentId !== '')
    }

    const normalizeAssignmentData = (data: any[]): TeachUsAssignment[] => {
        return data.map((row, index) => ({
            title: findValue(row, 'Title', 'Assignment Title', 'Assignment Name', 'AssignmentTitle', 'Name') || `Assignment ${index + 1}`,
            subject: findValue(row, 'Subject', 'Course', 'Class', 'SubjectName') || 'General',
            dueDate: findValue(row, 'Due Date', 'Deadline', 'Last Date', 'DueDate', 'Due') ||
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalMarks: parseInt(findValue(row, 'Total Marks', 'Marks', 'Max Score', 'TotalMarks', 'MaxMarks') || '100'),
            description: findValue(row, 'Description', 'Instructions', 'Details', 'Desc') || '',
            submissionCount: parseInt(findValue(row, 'Submissions', 'Submitted', 'SubmissionCount') || '0')
        })).filter(item => item.title !== '')
    }

    const normalizeScheduleData = (data: any[]): TeachUsSchedule[] => {
        return data.map(row => ({
            day: findValue(row, 'Day', 'Day of Week', 'DayOfWeek', 'Weekday') || 'Monday',
            subject: findValue(row, 'Subject', 'Course', 'Lecture', 'Class', 'SubjectName') || 'General',
            time: findValue(row, 'Time', 'Slot', 'Timing', 'Period', 'LectureTime') || '09:00 AM - 10:00 AM',
            room: findValue(row, 'Room', 'Classroom', 'Venue', 'Location', 'RoomNo') || 'TBD',
            teacher: findValue(row, 'Teacher', 'Faculty', 'Instructor', 'Professor', 'TeacherName') || 'TBD'
        })).filter(item => item.subject !== 'General' || item.teacher !== 'TBD')
    }

    const normalizeStudentData = (data: any[]): TeachUsStudent[] => {
        return data.map((row, index) => ({
            rollNo: findValue(row, 'Roll No', 'Student ID', 'Enrollment No', 'RollNo', 'Roll', 'ID') || `STU${index + 1}`,
            name: findValue(row, 'Name', 'Student Name', 'Full Name', 'StudentName') || 'Unknown',
            email: findValue(row, 'Email', 'Email ID', 'Mail', 'EmailAddress') || '',
            phone: findValue(row, 'Phone', 'Mobile', 'Contact', 'PhoneNumber', 'MobileNo') || '',
            division: findValue(row, 'Division', 'Class', 'Section', 'Div', 'Batch') || 'A',
            semester: findValue(row, 'Semester', 'Sem', 'Year', 'Sem No') || '1'
        })).filter(item => item.name !== 'Unknown')
    }

    const broadcastUpdate = (type: string, data: any[]) => {
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('teachusDataSync', {
            detail: { type, data }
        }))

        // Also trigger storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
            key: `teachus_${type}`,
            newValue: JSON.stringify(data)
        }))
    }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        setImporting(true)
        setImportResults(null)

        try {
            let data: any[] = []
            let extractedMetadata: CourseInfo | null = null

            if (file.name.endsWith('.csv')) {
                // Use the enhanced parser that extracts metadata
                const result = await parseCSVWithMetadata(file)
                data = result.data
                extractedMetadata = result.metadata

                // Auto-save extracted college info if found
                if (extractedMetadata && (extractedMetadata.university || extractedMetadata.department || extractedMetadata.course)) {
                    const currentInfo = { ...courseInfo }
                    // Only update fields that were extracted (don't overwrite with empty)
                    if (extractedMetadata.university) currentInfo.university = extractedMetadata.university
                    if (extractedMetadata.department) currentInfo.department = extractedMetadata.department
                    if (extractedMetadata.course) currentInfo.course = extractedMetadata.course
                    if (extractedMetadata.term) currentInfo.term = extractedMetadata.term
                    if (extractedMetadata.semester) currentInfo.semester = extractedMetadata.semester
                    if (extractedMetadata.faculty) currentInfo.faculty = extractedMetadata.faculty
                    if (extractedMetadata.createdOn) currentInfo.createdOn = extractedMetadata.createdOn
                    if (extractedMetadata.creatorName) currentInfo.creatorName = extractedMetadata.creatorName

                    // Save to localStorage and update state
                    localStorage.setItem('teachus_course_info', JSON.stringify(currentInfo))
                    setCourseInfo(currentInfo)

                    // Broadcast update for real-time sync
                    window.dispatchEvent(new CustomEvent('teachusDataSync', {
                        detail: { type: 'course_info', data: currentInfo }
                    }))

                    console.log('Auto-saved college info from import:', currentInfo)
                }
            } else if (file.name.endsWith('.json')) {
                const text = await file.text()
                data = JSON.parse(text)
                if (!Array.isArray(data)) {
                    data = [data]
                }
            } else {
                toast({
                    title: "Unsupported Format",
                    description: "Please use CSV or JSON format.",
                    variant: "destructive"
                })
                setImporting(false)
                return
            }

            if (data.length === 0) {
                toast({
                    title: "Empty File",
                    description: "The file contains no data.",
                    variant: "destructive"
                })
                setImporting(false)
                return
            }

            // Detect type or use selected tab
            const detectedType = detectDataType(data)
            const importType = detectedType !== 'unknown' ? detectedType : activeTab as any

            console.log('Detected type:', detectedType, 'Using:', importType)

            let normalizedData: any[] = []
            let errors: string[] = []

            switch (importType) {
                case 'attendance':
                    normalizedData = normalizeAttendanceData(data)
                    break
                case 'assignments':
                    normalizedData = normalizeAssignmentData(data)
                    break
                case 'schedule':
                    normalizedData = normalizeScheduleData(data)
                    break
                case 'students':
                    normalizedData = normalizeStudentData(data)
                    break
                default:
                    errors.push('Could not determine data type. Please select the correct tab.')
            }

            if (normalizedData.length === 0) {
                errors.push('No valid records found. Please check your file format.')
            }

            console.log('Normalized data:', normalizedData)

            setPreviewData(normalizedData.slice(0, 5))
            setImportResults({
                success: errors.length === 0 && normalizedData.length > 0,
                type: importType,
                recordsImported: normalizedData.length,
                errors,
                data: normalizedData
            })

            if (normalizedData.length > 0) {
                // Store in localStorage
                localStorage.setItem(`teachus_${importType}`, JSON.stringify(normalizedData))

                // Broadcast update for real-time sync
                broadcastUpdate(importType, normalizedData)

                // Show toast with college info notice if extracted
                const collegeInfoExtracted = extractedMetadata && (extractedMetadata.university || extractedMetadata.department || extractedMetadata.course)
                toast({
                    title: "Import Successful! ✅",
                    description: collegeInfoExtracted
                        ? `${normalizedData.length} ${importType} records imported! College info also extracted and saved.`
                        : `${normalizedData.length} ${importType} records imported and synced to dashboard!`,
                })
            }

        } catch (error) {
            console.error('Import error:', error)
            toast({
                title: "Import Failed",
                description: "Failed to parse the file. Please check the format and try again.",
                variant: "destructive"
            })
            setImportResults({
                success: false,
                type: activeTab as any,
                recordsImported: 0,
                errors: [(error as Error).message],
                data: []
            })
        } finally {
            setImporting(false)
        }
    }, [activeTab, toast, courseInfo])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/json': ['.json'],
        },
        maxFiles: 1
    })

    const clearData = (type: string) => {
        localStorage.removeItem(`teachus_${type}`)
        setStoredCounts(prev => ({ ...prev, [type]: 0 }))
        broadcastUpdate(type, [])
        toast({
            title: "Data Cleared",
            description: `All ${type} data has been removed.`,
        })
    }

    const downloadSampleCSV = (type: string) => {
        let sampleData = ''

        switch (type) {
            case 'attendance':
                sampleData = `Roll No,Name,Date,Status,Subject,Time
STU001,Alice Johnson,2024-01-15,Present,Mathematics,09:00 AM
STU002,Bob Smith,2024-01-15,Absent,Mathematics,09:00 AM
STU003,Charlie Brown,2024-01-15,Late,Mathematics,09:00 AM
STU004,Diana Prince,2024-01-15,Present,Mathematics,09:00 AM
STU005,Edward Norton,2024-01-16,Present,Physics,10:00 AM
STU001,Alice Johnson,2024-01-16,Present,Physics,10:00 AM`
                break
            case 'assignments':
                sampleData = `Title,Subject,Due Date,Total Marks,Description,Submissions
Midterm Project,Computer Science,2024-01-30,100,Build a web application,15
Research Paper,English,2024-01-25,50,Write about modern literature,22
Lab Report,Physics,2024-02-05,30,Experiment analysis,18`
                break
            case 'schedule':
                sampleData = `Day,Subject,Time,Room,Teacher
Monday,Mathematics,09:00 AM - 10:30 AM,Room 101,Dr. Smith
Monday,Physics,11:00 AM - 12:30 PM,Lab 201,Prof. Johnson
Tuesday,English,09:00 AM - 10:30 AM,Room 102,Ms. Davis
Wednesday,Computer Science,02:00 PM - 03:30 PM,Lab 301,Mr. Wilson`
                break
            case 'students':
                sampleData = `Roll No,Name,Email,Phone,Division,Semester
STU001,Alice Johnson,alice@college.edu,9876543210,A,3
STU002,Bob Smith,bob@college.edu,9876543211,A,3
STU003,Charlie Brown,charlie@college.edu,9876543212,B,3`
                break
        }

        const blob = new Blob([sampleData], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sample_${type}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Upload className="w-8 h-8 text-primary" />
                        Import Data from TeachUs
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Import attendance, assignments, schedules, and student data from TeachUs exports
                    </p>
                </div>
                <a
                    href="https://www.teachusapp.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                >
                    <ExternalLink className="w-4 h-4" />
                    Visit TeachUs
                </a>
            </div>

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                How to Import Data
                            </h3>
                            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>1. Export data from your TeachUs app or any system as CSV</li>
                                <li>2. Select the correct data type tab below (Attendance, Assignments, etc.)</li>
                                <li>3. Drag and drop your file or click to upload</li>
                                <li>4. Data will automatically sync to the respective dashboard page</li>
                            </ol>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Import Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                    <TabsTrigger value="attendance" className="gap-2">
                        <Users className="w-4 h-4" />
                        Attendance
                    </TabsTrigger>
                    <TabsTrigger value="assignments" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Assignments
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Schedule
                    </TabsTrigger>
                    <TabsTrigger value="students" className="gap-2">
                        <Users className="w-4 h-4" />
                        Students
                    </TabsTrigger>
                </TabsList>

                {['attendance', 'assignments', 'schedule', 'students'].map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Upload Area */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileSpreadsheet className="w-5 h-5" />
                                        Upload {tab.charAt(0).toUpperCase() + tab.slice(1)} File
                                    </CardTitle>
                                    <CardDescription>
                                        Drag and drop a CSV file or click to browse
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${isDragActive
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary hover:bg-muted/50'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {importing ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                                                <p className="text-muted-foreground">Processing file...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                                {isDragActive ? (
                                                    <p className="text-primary font-medium">Drop the file here...</p>
                                                ) : (
                                                    <>
                                                        <p className="text-foreground font-medium mb-1">
                                                            Drop your {tab} CSV file here
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            or click to browse
                                                        </p>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => downloadSampleCSV(tab)}
                                            className="flex-1"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Sample CSV
                                        </Button>
                                        {storedCounts[tab] > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => clearData(tab)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Results & Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {importResults?.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : importResults?.success === false ? (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-muted-foreground" />
                                        )}
                                        Import Results
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {importResults ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                <span className="text-sm font-medium">Records Imported</span>
                                                <Badge variant={importResults.success ? "default" : "destructive"}>
                                                    {importResults.recordsImported}
                                                </Badge>
                                            </div>

                                            {importResults.errors.length > 0 && (
                                                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                                                        Errors:
                                                    </p>
                                                    <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                                                        {importResults.errors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {importResults.success && (
                                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                                    <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Data synced to dashboard in real-time!
                                                    </p>
                                                </div>
                                            )}

                                            {previewData.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium mb-2">Preview (first 5 records):</p>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                                        {previewData.map((item, index) => (
                                                            <div key={index} className="p-2 bg-muted/50 rounded text-xs font-mono overflow-hidden">
                                                                <pre className="whitespace-pre-wrap break-all">
                                                                    {JSON.stringify(item, null, 2)}
                                                                </pre>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                                            <p>Upload a file to see import results</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {/* College/Institution Info Settings */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        College/Institution Information
                    </CardTitle>
                    <CardDescription>
                        Enter your college details. This information will appear in attendance reports and exports.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="university">University Name</Label>
                            <Input
                                id="university"
                                placeholder="e.g., University of Mumbai"
                                value={courseInfo.university}
                                onChange={(e) => updateCourseInfo('university', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                placeholder="e.g., Computer Science Dept."
                                value={courseInfo.department}
                                onChange={(e) => updateCourseInfo('department', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="course">Course</Label>
                            <Input
                                id="course"
                                placeholder="e.g., B.Sc Computer Science"
                                value={courseInfo.course}
                                onChange={(e) => updateCourseInfo('course', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="term">Term</Label>
                            <Input
                                id="term"
                                placeholder="e.g., 1 or 2"
                                value={courseInfo.term}
                                onChange={(e) => updateCourseInfo('term', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semester">Semester</Label>
                            <Input
                                id="semester"
                                placeholder="e.g., A or 3rd"
                                value={courseInfo.semester}
                                onChange={(e) => updateCourseInfo('semester', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="faculty">Faculty Name</Label>
                            <Input
                                id="faculty"
                                placeholder="e.g., Dr. John Smith"
                                value={courseInfo.faculty}
                                onChange={(e) => updateCourseInfo('faculty', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="creatorName">Creator/Teacher Name</Label>
                            <Input
                                id="creatorName"
                                placeholder="e.g., Prof. Jane Doe"
                                value={courseInfo.creatorName}
                                onChange={(e) => updateCourseInfo('creatorName', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="createdOn">Created On</Label>
                            <Input
                                id="createdOn"
                                placeholder="e.g., 13 Dec 2025"
                                value={courseInfo.createdOn}
                                onChange={(e) => updateCourseInfo('createdOn', e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={saveCourseInfo} className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                Save College Info
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Attendance', key: 'attendance', icon: Users, color: 'blue' },
                    { label: 'Assignments', key: 'assignments', icon: FileText, color: 'orange' },
                    { label: 'Schedule', key: 'schedule', icon: Calendar, color: 'green' },
                    { label: 'Students', key: 'students', icon: Users, color: 'purple' },
                ].map((item) => {
                    const count = storedCounts[item.key] || 0

                    return (
                        <Card key={item.key} className={count > 0 ? 'ring-2 ring-green-500/20' : ''}>
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/20 flex items-center justify-center`}>
                                    <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{count}</p>
                                    <p className="text-sm text-muted-foreground">{item.label}</p>
                                </div>
                                {count > 0 && (
                                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

