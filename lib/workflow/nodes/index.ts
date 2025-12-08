/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeType } from '@/lib/types';
import { HttpRequestNode } from './HttpRequestNode';
import { TwilioSmsNode } from './TwilioSmsNode';
import { TwilioWhatsAppNode } from './TwilioWhatsAppNode';
import { SlackSendNode } from './SlackSendNode';
import { DiscordSendNode } from './DiscordSendNode';
import { EmailSendNode } from './EmailSendNode';
import { FileUploadNode } from './FileUploadNode';
import { LocalAINode } from './LocalAINode';
import { ConditionNode } from './ConditionNode';
import { DelayNode } from './DelayNode';
import { WhatsAppGroupNode } from './WhatsAppGroupNode';
import { AlertSendNode } from './AlertSendNode';
import { AttendanceTrackNode } from './AttendanceTrackNode';
import { AssignmentCreateNode } from './AssignmentCreateNode';
import { ScheduleCheckNode } from './ScheduleCheckNode';
import { GenericNode } from './GenericNode';

export function createNodeInstance(type: NodeType | string, config: Record<string, any> = {}): BaseNode {
    // Convert string to NodeType if needed
    const nodeType = type as NodeType;

    switch (nodeType) {
        // Core nodes with full implementation
        case NodeType.HTTP_REQUEST:
        case 'http-request':
            return new HttpRequestNode(config);
        case NodeType.TWILIO_SMS:
        case 'twilio-sms':
            return new TwilioSmsNode(config);
        case NodeType.TWILIO_WHATSAPP:
        case 'twilio-whatsapp':
            return new TwilioWhatsAppNode(config);
        case NodeType.SLACK_SEND:
        case 'slack-send':
            return new SlackSendNode(config);
        case NodeType.DISCORD_SEND:
        case 'discord-send':
            return new DiscordSendNode(config);
        case NodeType.EMAIL_SEND:
        case 'email-send':
            return new EmailSendNode(config);
        case NodeType.FILE_UPLOAD:
        case 'file-upload':
            return new FileUploadNode(config);
        case NodeType.LOCAL_AI:
        case 'local-ai':
            return new LocalAINode(config);
        case NodeType.CONDITION:
        case 'condition':
            return new ConditionNode(config);
        case NodeType.DELAY:
        case 'delay':
            return new DelayNode(config);
        case NodeType.WHATSAPP_GROUP:
        case 'whatsapp-group':
            return new WhatsAppGroupNode(config);
        case NodeType.ALERT_SEND:
        case 'alert-send':
            return new AlertSendNode(config);
        case NodeType.ATTENDANCE_TRACK:
        case 'attendance-track':
            return new AttendanceTrackNode(config);
        case NodeType.ASSIGNMENT_CREATE:
        case 'assignment-create':
            return new AssignmentCreateNode(config);
        case NodeType.SCHEDULE_CHECK:
        case 'schedule-check':
            return new ScheduleCheckNode(config);

        // Triggers - return generic with trigger behavior
        case NodeType.TRIGGER_SCHEDULE:
        case 'trigger-schedule':
            return new GenericNode(config, 'trigger-schedule', 'Schedule Trigger',
                'Triggered on schedule', { scheduled: true, cronExpression: config.cronExpression });
        case NodeType.TRIGGER_WEBHOOK:
        case 'trigger-webhook':
            return new GenericNode(config, 'trigger-webhook', 'Webhook Trigger',
                'Ready to receive webhooks', { webhookUrl: `/api/webhooks/${config.webhookId || 'pending'}` });
        case NodeType.TRIGGER_FORM:
        case 'trigger-form':
            return new GenericNode(config, 'trigger-form', 'Form Trigger',
                'Waiting for form submission', { formId: config.formId });
        case NodeType.TRIGGER_EMAIL:
        case 'trigger-email':
            return new GenericNode(config, 'trigger-email', 'Email Trigger',
                'Monitoring for emails', { filter: config.emailFilter });

        // Google Suite
        case NodeType.GOOGLE_CLASSROOM:
        case 'google-classroom':
            return new GenericNode(config, 'google-classroom', 'Google Classroom',
                'Google Classroom integration ready', { action: config.action });
        case NodeType.GOOGLE_DRIVE:
        case 'google-drive':
            return new GenericNode(config, 'google-drive', 'Google Drive',
                'Google Drive connected', { folderId: config.folderId });
        case NodeType.GOOGLE_SHEETS:
        case 'google-sheets':
            return new GenericNode(config, 'google-sheets', 'Google Sheets',
                'Spreadsheet linked', { spreadsheetId: config.spreadsheetId });
        case NodeType.GOOGLE_CALENDAR:
        case 'google-calendar':
            return new GenericNode(config, 'google-calendar', 'Google Calendar',
                'Calendar synced', { calendarId: config.calendarId });
        case NodeType.GOOGLE_MEET:
        case 'google-meet':
            return new GenericNode(config, 'google-meet', 'Google Meet',
                'Meeting ready', { meetingLink: config.meetingLink });
        case NodeType.GOOGLE_FORMS:
        case 'google-forms':
            return new GenericNode(config, 'google-forms', 'Google Forms',
                'Form connected', { formId: config.formId });

        // Microsoft 365
        case NodeType.MICROSOFT_TEAMS:
        case 'microsoft-teams':
            return new GenericNode(config, 'microsoft-teams', 'Microsoft Teams',
                'Teams connected', { channelId: config.channelId });
        case NodeType.MICROSOFT_OUTLOOK:
        case 'microsoft-outlook':
            return new GenericNode(config, 'microsoft-outlook', 'Outlook',
                'Email ready', { to: config.to });
        case NodeType.MICROSOFT_ONEDRIVE:
        case 'microsoft-onedrive':
            return new GenericNode(config, 'microsoft-onedrive', 'OneDrive',
                'Storage linked', { path: config.path });
        case NodeType.MICROSOFT_EXCEL:
        case 'microsoft-excel':
            return new GenericNode(config, 'microsoft-excel', 'Excel',
                'Workbook ready', { workbookId: config.workbookId });

        // Video & Meetings
        case NodeType.ZOOM_MEETING:
        case 'zoom-meeting':
            return new GenericNode(config, 'zoom-meeting', 'Zoom Meeting',
                'Meeting created', { topic: config.topic, startTime: config.startTime });
        case NodeType.ZOOM_RECORDING:
        case 'zoom-recording':
            return new GenericNode(config, 'zoom-recording', 'Zoom Recording',
                'Recording retrieved', { meetingId: config.meetingId });

        // Communication
        case NodeType.TELEGRAM_SEND:
        case 'telegram-send':
            return new GenericNode(config, 'telegram-send', 'Telegram',
                'Message sent', { chatId: config.chatId, message: config.message });

        // Education
        case NodeType.GRADE_CALCULATE:
        case 'grade-calculate':
            return new GenericNode(config, 'grade-calculate', 'Grade Calculator',
                'Grades calculated', { formula: config.formula });
        case NodeType.STUDENT_NOTIFY:
        case 'student-notify':
            return new GenericNode(config, 'student-notify', 'Student Notification',
                'Students notified', { studentIds: config.studentIds });
        case NodeType.QUIZ_CREATE:
        case 'quiz-create':
            return new GenericNode(config, 'quiz-create', 'Quiz Created',
                'Quiz ready', { title: config.title, questions: config.questions?.length || 0 });
        case NodeType.REPORT_GENERATE:
        case 'report-generate':
            return new GenericNode(config, 'report-generate', 'Report Generated',
                'Report ready', { type: config.reportType });

        // AI & Analytics
        case NodeType.AI_SUMMARIZE:
        case 'ai-summarize':
            return new GenericNode(config, 'ai-summarize', 'AI Summary',
                'Content summarized', { inputLength: config.text?.length || 0 });
        case NodeType.AI_TRANSLATE:
        case 'ai-translate':
            return new GenericNode(config, 'ai-translate', 'AI Translation',
                'Text translated', { from: config.fromLanguage, to: config.toLanguage });
        case NodeType.AI_SENTIMENT:
        case 'ai-sentiment':
            return new GenericNode(config, 'ai-sentiment', 'Sentiment Analysis',
                'Sentiment analyzed', { score: 'neutral' }); // Would be computed
        case NodeType.ANALYTICS_TRACK:
        case 'analytics-track':
            return new GenericNode(config, 'analytics-track', 'Analytics Tracked',
                'Event tracked', { event: config.eventName });
        case NodeType.CHART_GENERATE:
        case 'chart-generate':
            return new GenericNode(config, 'chart-generate', 'Chart Generated',
                'Chart created', { chartType: config.chartType });

        // Data & Storage
        case NodeType.DATABASE_QUERY:
        case 'database-query':
            return new GenericNode(config, 'database-query', 'Database Query',
                'Query executed', { query: config.query?.substring(0, 50) });
        case NodeType.SPREADSHEET_UPDATE:
        case 'spreadsheet-update':
            return new GenericNode(config, 'spreadsheet-update', 'Spreadsheet Updated',
                'Cells updated', { range: config.range });
        case NodeType.FILE_READ:
        case 'file-read':
            return new GenericNode(config, 'file-read', 'File Read',
                'File loaded', { path: config.filePath });
        case NodeType.FILE_WRITE:
        case 'file-write':
            return new GenericNode(config, 'file-write', 'File Written',
                'File saved', { path: config.filePath });
        case NodeType.JSON_PARSE:
        case 'json-parse':
            return new GenericNode(config, 'json-parse', 'JSON Parsed',
                'Data parsed', { keys: Object.keys(config.data || {}).length });

        // Logic & Utility
        case NodeType.LOOP:
        case 'loop':
            return new GenericNode(config, 'loop', 'Loop',
                'Loop processed', { iterations: config.items?.length || config.count || 0 });
        case NodeType.FILTER:
        case 'filter':
            return new GenericNode(config, 'filter', 'Filter',
                'Data filtered', { condition: config.condition });
        case NodeType.SPLIT:
        case 'split':
            return new GenericNode(config, 'split', 'Split',
                'Workflow split', { branches: config.branches || 2 });
        case NodeType.MERGE:
        case 'merge':
            return new GenericNode(config, 'merge', 'Merge',
                'Branches merged', { inputs: config.inputCount || 2 });
        case NodeType.TRANSFORM:
        case 'transform':
            return new GenericNode(config, 'transform', 'Transform',
                'Data transformed', { transform: config.transformType });

        default:
            // For any unregistered node types, use GenericNode
            console.warn(`Using generic handler for unknown node type: ${type}`);
            return new GenericNode(config, type as string, `${type}`,
                `Node executed (${type})`, config);
    }
}

export function getAllNodeTypes(): { type: NodeType; label: string; description: string; category: string }[] {
    return [
        // Core nodes
        {
            type: NodeType.HTTP_REQUEST,
            label: 'HTTP Request',
            description: 'Make HTTP requests to external APIs',
            category: 'Integration'
        },
        {
            type: NodeType.TWILIO_SMS,
            label: 'Send SMS',
            description: 'Send SMS messages via Twilio',
            category: 'Communication'
        },
        {
            type: NodeType.TWILIO_WHATSAPP,
            label: 'Send WhatsApp',
            description: 'Send WhatsApp messages via Twilio',
            category: 'Communication'
        },
        {
            type: NodeType.WHATSAPP_GROUP,
            label: 'WhatsApp Group Alert',
            description: 'Send messages to WhatsApp groups',
            category: 'Communication'
        },
        {
            type: NodeType.ALERT_SEND,
            label: 'Multi-Channel Alert',
            description: 'Send alerts via WhatsApp, Email, and SMS',
            category: 'Communication'
        },
        {
            type: NodeType.SLACK_SEND,
            label: 'Send to Slack',
            description: 'Send messages to Slack channels',
            category: 'Communication'
        },
        {
            type: NodeType.DISCORD_SEND,
            label: 'Send to Discord',
            description: 'Send messages to Discord channels',
            category: 'Communication'
        },
        {
            type: NodeType.EMAIL_SEND,
            label: 'Send Email',
            description: 'Send emails via SMTP',
            category: 'Communication'
        },
        {
            type: NodeType.ATTENDANCE_TRACK,
            label: 'Track Attendance',
            description: 'Monitor student attendance and trigger alerts',
            category: 'Education'
        },
        {
            type: NodeType.ASSIGNMENT_CREATE,
            label: 'Create Assignment',
            description: 'Create and distribute assignments',
            category: 'Education'
        },
        {
            type: NodeType.SCHEDULE_CHECK,
            label: 'Check Schedule',
            description: 'Check class schedule and send reminders',
            category: 'Education'
        },
        {
            type: NodeType.FILE_UPLOAD,
            label: 'Upload File',
            description: 'Upload files to local storage',
            category: 'Utility'
        },
        {
            type: NodeType.LOCAL_AI,
            label: 'AI Analysis',
            description: 'Analyze text with local AI',
            category: 'Utility'
        },
        {
            type: NodeType.CONDITION,
            label: 'Condition',
            description: 'Evaluate conditions and branch logic',
            category: 'Logic'
        },
        {
            type: NodeType.DELAY,
            label: 'Delay',
            description: 'Add delays between actions',
            category: 'Utility'
        },
        // Triggers
        {
            type: NodeType.TRIGGER_SCHEDULE,
            label: 'Schedule Trigger',
            description: 'Run workflow on a schedule',
            category: 'Triggers'
        },
        {
            type: NodeType.TRIGGER_WEBHOOK,
            label: 'Webhook Trigger',
            description: 'Trigger via HTTP webhook',
            category: 'Triggers'
        },
        // Google Suite
        {
            type: NodeType.GOOGLE_CLASSROOM,
            label: 'Google Classroom',
            description: 'Manage Google Classroom',
            category: 'Google'
        },
        {
            type: NodeType.GOOGLE_SHEETS,
            label: 'Google Sheets',
            description: 'Read/write spreadsheet data',
            category: 'Google'
        },
        {
            type: NodeType.GOOGLE_CALENDAR,
            label: 'Google Calendar',
            description: 'Manage calendar events',
            category: 'Google'
        },
    ];
}
