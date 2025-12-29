import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const organizationId = user.organizationId;

        // Fetch Class Schedules for unique class IDs and subjects
        const classSchedules = await prisma.classSchedule.findMany({
            where: { organizationId },
            select: {
                classId: true,
                subject: true,
            }
        });

        // Unique classes and subjects
        const classes = Array.from(new Set(classSchedules.map(c => c.classId)));
        const subjects = Array.from(new Set(classSchedules.map(c => c.subject)));

        // Fetch Assignments
        const assignments = await prisma.assignment.findMany({
            where: { organizationId },
            select: {
                id: true,
                title: true,
                dueDate: true,
            }
        });

        // Fetch Attendance records to get unique student IDs
        const attendanceRecords = await prisma.attendance.findMany({
            where: { organizationId },
            select: {
                studentId: true,
            },
            distinct: ['studentId']
        });
        const students = attendanceRecords.map(a => a.studentId);

        return NextResponse.json({
            ok: true,
            data: {
                classes,
                subjects,
                assignments,
                students
            }
        });

    } catch (error) {
        console.error('[EDUCATION_DATA] Error fetching education data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
