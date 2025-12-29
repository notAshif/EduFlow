/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext, NodeResult } from '@/lib/types';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export class ReportGenerateNode extends BaseNode {
    async execute(context: NodeExecutionContext): Promise<NodeResult> {
        const startTime = Date.now();

        try {
            const {
                reportType,
                format,
                includeCharts,
                dateRange,
                classId
            } = this.config;

            console.log('[REPORT] Generating report:', { reportType, format });

            // Get organization data
            const orgId = context.context.organizationId;

            // Generate report based on type
            let reportData: any;
            let reportTitle: string;

            switch (reportType) {
                case 'attendance':
                    reportData = await this.generateAttendanceReport(orgId, classId, dateRange);
                    reportTitle = 'Attendance Report';
                    break;
                case 'assignments':
                    reportData = await this.generateAssignmentsReport(orgId);
                    reportTitle = 'Assignments Report';
                    break;
                case 'schedule':
                    reportData = await this.generateScheduleReport(orgId);
                    reportTitle = 'Class Schedule Report';
                    break;
                default:
                    reportData = await this.generateSummaryReport(orgId);
                    reportTitle = 'Summary Report';
            }

            // Generate the report file
            const reportOutput = await this.createReportFile(reportTitle, reportData, format || 'html', includeCharts);

            console.log('[REPORT] ✓ Report generated successfully');

            return {
                nodeId: context.context.runId,
                success: true,
                output: {
                    reportType,
                    format: format || 'html',
                    title: reportTitle,
                    generatedAt: new Date().toISOString(),
                    data: reportData,
                    ...reportOutput
                },
                durationMs: Date.now() - startTime
            };

        } catch (error) {
            console.error('[REPORT] Error:', error);
            return {
                nodeId: context.context.runId,
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate report',
                durationMs: Date.now() - startTime
            };
        }
    }

    private async generateAttendanceReport(orgId: string, classId?: string, dateRange?: string) {
        // Fetch attendance data
        const attendanceRecords = await prisma.attendance.findMany({
            where: { organizationId: orgId },
            orderBy: { date: 'desc' },
            take: 200
        });

        // Calculate statistics
        const totalRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;

        const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : '0';

        // Group by studentId
        const studentStats: Record<string, { studentId: string; present: number; absent: number; late: number; total: number }> = {};

        for (const record of attendanceRecords) {
            const studentKey = record.studentId;

            if (!studentStats[studentKey]) {
                studentStats[studentKey] = { studentId: studentKey, present: 0, absent: 0, late: 0, total: 0 };
            }

            studentStats[studentKey].total++;
            if (record.status === 'PRESENT') studentStats[studentKey].present++;
            if (record.status === 'ABSENT') studentStats[studentKey].absent++;
            if (record.status === 'LATE') studentStats[studentKey].late++;
        }

        return {
            summary: {
                totalRecords,
                presentCount,
                absentCount,
                lateCount,
                attendanceRate: `${attendanceRate}%`
            },
            byStudent: Object.values(studentStats).map(s => ({
                ...s,
                attendanceRate: s.total > 0 ? `${((s.present / s.total) * 100).toFixed(1)}%` : '0%'
            })),
            period: dateRange || 'All Time',
            generatedAt: new Date().toISOString()
        };
    }

    private async generateAssignmentsReport(orgId: string) {
        // Fetch assignments
        const assignments = await prisma.assignment.findMany({
            where: { organizationId: orgId },
            orderBy: { dueDate: 'desc' },
            take: 50
        });

        const assignmentData = assignments.map(a => ({
            title: a.title,
            description: a.description || 'No description',
            dueDate: a.dueDate?.toISOString().split('T')[0] || 'No due date',
            createdAt: a.createdAt.toISOString().split('T')[0]
        }));

        // Count by status
        const now = new Date();
        const upcoming = assignments.filter(a => a.dueDate && a.dueDate > now).length;
        const overdue = assignments.filter(a => a.dueDate && a.dueDate < now).length;

        return {
            summary: {
                totalAssignments: assignments.length,
                upcoming,
                overdue
            },
            assignments: assignmentData,
            generatedAt: new Date().toISOString()
        };
    }

    private async generateScheduleReport(orgId: string) {
        const schedules = await prisma.classSchedule.findMany({
            where: { organizationId: orgId },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
        });

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const scheduleData = schedules.map(s => ({
            day: dayNames[s.dayOfWeek] || `Day ${s.dayOfWeek}`,
            classId: s.classId,
            subject: s.subject,
            time: `${s.startTime} - ${s.endTime}`
        }));

        return {
            summary: {
                totalClasses: schedules.length,
                uniqueSubjects: [...new Set(schedules.map(s => s.subject))].length
            },
            schedule: scheduleData,
            generatedAt: new Date().toISOString()
        };
    }

    private async generateSummaryReport(orgId: string) {
        // General summary of all data
        const [assignmentCount, attendanceCount, scheduleCount] = await Promise.all([
            prisma.assignment.count({ where: { organizationId: orgId } }),
            prisma.attendance.count({ where: { organizationId: orgId } }),
            prisma.classSchedule.count({ where: { organizationId: orgId } })
        ]);

        return {
            summary: {
                assignments: assignmentCount,
                attendanceRecords: attendanceCount,
                scheduledClasses: scheduleCount
            },
            generatedAt: new Date().toISOString()
        };
    }

    private async createReportFile(title: string, data: any, format: string, includeCharts: boolean) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `report_${timestamp}`;

        // Generate HTML content
        const htmlContent = this.generateHTMLReport(title, data, includeCharts);

        if (format === 'html' || format === 'pdf') {
            // Save HTML file
            const reportsDir = path.join(process.cwd(), 'public', 'reports');

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const filePath = path.join(reportsDir, `${fileName}.html`);
            fs.writeFileSync(filePath, htmlContent);

            console.log(`[REPORT] Saved to: ${filePath}`);

            return {
                filePath: `/reports/${fileName}.html`,
                fileName: `${fileName}.html`,
                message: `Report saved! View at: /reports/${fileName}.html`
            };
        }

        // For other formats, just return the data
        return {
            fileName: `${fileName}.json`,
            rawData: JSON.stringify(data, null, 2).substring(0, 1000)
        };
    }

    private generateHTMLReport(title: string, data: any, includeCharts: boolean): string {
        const dataRows = this.renderDataAsTable(data);

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - EduFlow Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            padding: 30px 40px;
        }
        .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
        .header p { opacity: 0.8; font-size: 14px; }
        .content { padding: 40px; }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
        }
        .summary-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a2e;
            margin-bottom: 8px;
        }
        .summary-card .label {
            font-size: 14px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #1a1a2e;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        tr:hover td { background: #f8f9fa; }
        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        h3 { margin: 30px 0 16px; color: #1a1a2e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 ${title}</h1>
            <p>Generated on ${new Date().toLocaleString()} by EduFlow</p>
        </div>
        <div class="content">
            ${dataRows}
        </div>
        <div class="footer">
            <p>This report was automatically generated by EduFlow Workflow Automation</p>
        </div>
    </div>
</body>
</html>`;
    }

    private renderDataAsTable(data: any): string {
        let html = '';

        // Summary section
        if (data.summary) {
            html += '<div class="summary-grid">';
            for (const [key, value] of Object.entries(data.summary)) {
                html += `
                    <div class="summary-card">
                        <div class="value">${value}</div>
                        <div class="label">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                `;
            }
            html += '</div>';
        }

        // By Student table (Attendance)
        if (data.byStudent && Array.isArray(data.byStudent) && data.byStudent.length > 0) {
            html += '<h3>Student Breakdown</h3>';
            html += '<table><thead><tr>';
            html += '<th>Student ID</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th>';
            html += '</tr></thead><tbody>';

            for (const student of data.byStudent) {
                const rate = parseFloat(student.attendanceRate || '0');
                const badgeClass = rate >= 75 ? 'badge-success' : rate >= 50 ? 'badge-warning' : 'badge-danger';
                html += `<tr>
                    <td>${student.studentId}</td>
                    <td>${student.present}</td>
                    <td>${student.absent}</td>
                    <td>${student.late}</td>
                    <td><span class="badge ${badgeClass}">${student.attendanceRate}</span></td>
                </tr>`;
            }
            html += '</tbody></table>';
        }

        // Assignments table
        if (data.assignments && Array.isArray(data.assignments) && data.assignments.length > 0) {
            html += '<h3>Assignments</h3>';
            html += '<table><thead><tr>';
            html += '<th>Title</th><th>Description</th><th>Due Date</th><th>Created</th>';
            html += '</tr></thead><tbody>';

            for (const assignment of data.assignments) {
                html += `<tr>
                    <td>${assignment.title}</td>
                    <td>${assignment.description?.substring(0, 50) || '-'}...</td>
                    <td>${assignment.dueDate}</td>
                    <td>${assignment.createdAt}</td>
                </tr>`;
            }
            html += '</tbody></table>';
        }

        // Schedule table
        if (data.schedule && Array.isArray(data.schedule) && data.schedule.length > 0) {
            html += '<h3>Class Schedule</h3>';
            html += '<table><thead><tr>';
            html += '<th>Day</th><th>Class</th><th>Subject</th><th>Time</th>';
            html += '</tr></thead><tbody>';

            for (const slot of data.schedule) {
                html += `<tr>
                    <td>${slot.day}</td>
                    <td>${slot.classId}</td>
                    <td>${slot.subject}</td>
                    <td>${slot.time}</td>
                </tr>`;
            }
            html += '</tbody></table>';
        }

        // General data (fallback)
        if (!data.summary && !data.byStudent && !data.assignments && !data.schedule) {
            html += '<pre style="background: #f8f9fa; padding: 20px; border-radius: 8px; overflow-x: auto;">';
            html += JSON.stringify(data, null, 2);
            html += '</pre>';
        }

        return html;
    }

    validate(config: Record<string, any>): void {
        // Report type is optional, defaults to summary
    }
}
