/* eslint-disable @typescript-eslint/no-explicit-any */
export enum NodeType {
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
  | "whatsapp";

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