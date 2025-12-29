/* eslint-disable @typescript-eslint/no-explicit-any */
export enum NodeType {
  // Existing nodes
  HTTP_REQUEST = "http-request",
  SLACK_SEND = "slack-send",
  DISCORD_SEND = "discord-send",
  TWILIO_SMS = "twilio-sms",
  TWILIO_WHATSAPP = "twilio-whatsapp",
  EMAIL_SEND = "email-send",
  FILE_UPLOAD = "file-upload",
  LOCAL_AI = "local-ai",
  CONDITION = "condition",
  DELAY = "delay",
  ATTENDANCE_TRACK = "attendance-track",
  ASSIGNMENT_CREATE = "assignment-create",
  SCHEDULE_CHECK = "schedule-check",
  ALERT_SEND = "alert-send",
  WHATSAPP_GROUP = "whatsapp-group",

  // Triggers
  TRIGGER_SCHEDULE = "trigger-schedule",
  TRIGGER_WEBHOOK = "trigger-webhook",
  TRIGGER_FORM = "trigger-form",
  TRIGGER_EMAIL = "trigger-email",

  // Google Suite
  GOOGLE_CLASSROOM = "google-classroom",
  GOOGLE_DRIVE = "google-drive",
  GOOGLE_SHEETS = "google-sheets",
  GOOGLE_CALENDAR = "google-calendar",
  GOOGLE_MEET = "google-meet",
  GOOGLE_FORMS = "google-forms",

  // Microsoft 365
  MICROSOFT_TEAMS = "microsoft-teams",
  MICROSOFT_OUTLOOK = "microsoft-outlook",
  MICROSOFT_ONEDRIVE = "microsoft-onedrive",
  MICROSOFT_EXCEL = "microsoft-excel",

  // Communication
  TELEGRAM_SEND = "telegram-send",
  REMINDER = "reminder",

  // Video & Meetings
  ZOOM_MEETING = "zoom-meeting",
  ZOOM_RECORDING = "zoom-recording",

  // Education
  GRADE_CALCULATE = "grade-calculate",
  STUDENT_NOTIFY = "student-notify",
  QUIZ_CREATE = "quiz-create",
  REPORT_GENERATE = "report-generate",

  // AI & Analytics
  AI_SUMMARIZE = "ai-summarize",
  AI_TRANSLATE = "ai-translate",
  AI_SENTIMENT = "ai-sentiment",
  ANALYTICS_TRACK = "analytics-track",
  CHART_GENERATE = "chart-generate",

  // Data & Storage
  DATABASE_QUERY = "database-query",
  SPREADSHEET_UPDATE = "spreadsheet-update",
  FILE_READ = "file-read",
  FILE_WRITE = "file-write",
  JSON_PARSE = "json-parse",

  // Logic & Utility
  LOOP = "loop",
  FILTER = "filter",
  SPLIT = "split",
  MERGE = "merge",
  TRANSFORM = "transform",
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType?: string;
    config: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  enabled: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface NodeResult {
  nodeId: string;
  success: boolean;
  output?: any;
  error?: string;
  durationMs?: number;
}

export type IntegrationConnectionType =
  | "twilio"
  | "gmail"
  | "google-classroom"
  | "slack"
  | "discord"
  | "whatsapp"
  | "zoom"
  | "microsoft"
  | "telegram"
  | "openai";

export interface WorkflowExecutionPayload {
  workflowId: string;
  payload?: Record<string, any>;
}

export interface NodeExecutionContext {
  input: any;
  context: {
    workflowId: string;
    runId: string;
    organizationId: string;
    previousResults: NodeResult[];
  };
  services: {
    credentials?: Record<string, any> | null;
    [key: string]: any;
  };
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  organization: Organization;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  plan?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConnection {
  id: string;
  type: string;
  credentials: Record<string, any>;
  meta?: Record<string, any>;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}