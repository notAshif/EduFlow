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

export function createNodeInstance(type: NodeType, config: Record<string, any> = {}): BaseNode {
  switch (type) {
    case NodeType.HTTP_REQUEST:
      return new HttpRequestNode(config);
    case NodeType.TWILIO_SMS:
      return new TwilioSmsNode(config);
    case NodeType.TWILIO_WHATSAPP:
      return new TwilioWhatsAppNode(config);
    case NodeType.SLACK_SEND:
      return new SlackSendNode(config);
    case NodeType.DISCORD_SEND:
      return new DiscordSendNode(config);
    case NodeType.EMAIL_SEND:
      return new EmailSendNode(config);
    case NodeType.FILE_UPLOAD:
      return new FileUploadNode(config);
    case NodeType.LOCAL_AI:
      return new LocalAINode(config);
    case NodeType.CONDITION:
      return new ConditionNode(config);
    case NodeType.DELAY:
      return new DelayNode(config);
    case NodeType.WHATSAPP_GROUP:
      return new WhatsAppGroupNode(config);
    case NodeType.ALERT_SEND:
      return new AlertSendNode(config);
    case NodeType.ATTENDANCE_TRACK:
      return new AttendanceTrackNode(config);
    case NodeType.ASSIGNMENT_CREATE:
      return new AssignmentCreateNode(config);
    case NodeType.SCHEDULE_CHECK:
      return new ScheduleCheckNode(config);
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

export function getAllNodeTypes(): { type: NodeType; label: string; description: string; category: string }[] {
  return [
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
    }
  ];
}