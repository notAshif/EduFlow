/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/workflows/new/page.tsx
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  Edge,
  MarkerType,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  GitBranch,
  Upload,
  Brain,
  Globe,
  Slack,
  MessageCircle,
  Users,
  Bell,
  ClipboardCheck,
  FileText,
  Calendar,
  Save,
  Play,
  Plus,
  Settings2,
  X,
  Zap,
  Layers,
  Video,
  Database,
  Webhook,
  Timer,
  Send,
  BookOpen,
  GraduationCap,
  BarChart3,
  FolderOpen,
  PenTool,
  Link2,
  Bot,
  Sparkles,
  Cloud,
  HardDrive,
  Sheet,
  Presentation,
  FormInput,
  CheckSquare,
  ListTodo,
  Award,
  UserCheck,
  Megaphone,
  Filter,
  Repeat,
  Split,
  Merge,
  Code,
  Terminal,
  FileJson,
  Table,
  PieChart,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity
} from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

// --- Custom Node Component ---

// Node status types for visualization
type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning' | 'missing-integration';

const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  // Get status from data (set by workflow execution or integration check)
  const status: NodeStatus = data.status || 'idle';
  const hasIntegration = data.hasIntegration !== false; // Default to true if not specified
  const errorMessage = data.errorMessage;

  const getNodeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      // Communication
      "twilio-sms": Phone,
      "twilio-whatsapp": Phone,
      "email-send": Mail,
      "slack-send": Slack,
      "discord-send": MessageCircle,
      "whatsapp-group": Users,
      "alert-send": Bell,
      "teams-send": Users,
      "telegram-send": Send,
      // Education
      "attendance-track": ClipboardCheck,
      "assignment-create": FileText,
      "schedule-check": Calendar,
      "grade-calculate": Award,
      "student-notify": UserCheck,
      "report-generate": BarChart3,
      "classroom-post": BookOpen,
      "quiz-create": CheckSquare,
      // Google Suite
      "google-classroom": GraduationCap,
      "google-drive": FolderOpen,
      "google-sheets": Sheet,
      "google-calendar": Calendar,
      "google-meet": Video,
      "google-forms": FormInput,
      "google-slides": Presentation,
      // LMS Platforms
      "moodle": GraduationCap,
      "canvas-lms": BookOpen,
      "schoology": BookOpen,
      // Grading & Assessment
      "turnitin": ClipboardCheck,
      "gradescope": PenTool,
      "kahoot": Brain,
      // Analytics
      "power-bi": BarChart3,
      // Triggers
      "trigger-schedule": Timer,
      "trigger-webhook": Webhook,
      "trigger-form": FormInput,
      "trigger-email": Mail,
      // Logic & Utility
      delay: Clock,
      condition: GitBranch,
      "file-upload": Upload,
      "local-ai": Brain,
      "http-request": Globe,
      "loop": Repeat,
      "split": Split,
      "merge": Merge,
      "filter": Filter,
      "transform": Code,
      // Data & Storage
      "database-query": Database,
      "spreadsheet-update": Sheet,
      "file-read": FileText,
      "file-write": HardDrive,
      "json-parse": FileJson,
      // AI & Analytics
      "ai-summarize": Sparkles,
      "ai-translate": Globe,
      "ai-sentiment": Bot,
      "analytics-track": PieChart,
      "chart-generate": TrendingUp,
      // Video Conferencing
      "zoom-meeting": Video,
      "zoom-recording": Video,
    };

    const Icon = iconMap[type] || MessageSquare;
    return <Icon className="w-5 h-5 text-primary-foreground" />;
  };

  const getNodeColor = (type: string) => {
    // Specific Google Apps Branding
    if (type === 'google-sheets' || type === 'spreadsheet-update') return 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20';
    if (type === 'google-calendar' || type === 'schedule-check') return 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20';
    if (type === 'google-drive' || type === 'file-upload' || type === 'file-read') return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/20';
    if (type === 'google-forms' || type === 'trigger-form') return 'bg-gradient-to-br from-purple-500 to-violet-600 shadow-purple-500/20';
    if (type === 'google-meet' || type === 'zoom-meeting') return 'bg-gradient-to-br from-emerald-400 to-teal-600 shadow-emerald-500/20';
    if (type === 'google-classroom') return 'bg-gradient-to-br from-green-600 to-green-800 shadow-green-600/20';

    // Google - General
    if (type.startsWith('google-')) return 'bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500 shadow-blue-500/20';
    // Triggers
    if (type.startsWith('trigger-')) return 'bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-fuchsia-500/20';
    // AI
    if (type.startsWith('ai-') || type === 'local-ai') return 'bg-gradient-to-br from-violet-600 to-indigo-700 shadow-violet-600/20';
    // Communication
    if (type.includes('send') || type.includes('alert') || type.includes('notify') || type.includes('whatsapp')) return 'bg-gradient-to-br from-sky-500 to-blue-700 shadow-sky-500/20';
    // Education
    if (type.includes('track') || type.includes('grade') || type.includes('classroom') || type.includes('quiz')) return 'bg-gradient-to-br from-emerald-500 to-green-700 shadow-emerald-500/20';
    // Data
    if (type.includes('database') || type.includes('json')) return 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/20';
    // Logic
    if (type === 'condition' || type === 'loop' || type === 'split' || type === 'merge' || type === 'filter') return 'bg-gradient-to-br from-orange-400 to-red-500 shadow-orange-500/20';
    // Time
    if (type === 'delay') return 'bg-gradient-to-br from-amber-400 to-yellow-600 shadow-amber-500/20';

    // LMS Platforms
    if (type === 'moodle' || type === 'canvas-lms' || type === 'schoology') return 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/20';
    // Grading & Assessment
    if (type === 'turnitin' || type === 'gradescope' || type === 'kahoot') return 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20';
    // Analytics
    if (type === 'power-bi') return 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/20';

    return 'bg-primary shadow-primary/20';
  };

  // Get border color based on status
  const getBorderClass = () => {
    if (selected) return 'border-primary ring-4 ring-primary/10 scale-[1.02] z-10';
    switch (status) {
      case 'running': return 'border-blue-500 ring-2 ring-blue-500/20 animate-pulse';
      case 'success': return 'border-green-500 ring-2 ring-green-500/20';
      case 'error': return 'border-red-500 ring-2 ring-red-500/20';
      case 'warning': return 'border-yellow-500 ring-2 ring-yellow-500/20';
      case 'missing-integration': return 'border-orange-500 ring-2 ring-orange-500/20 border-dashed';
      default: return 'border-border hover:border-muted-foreground/50';
    }
  };

  // Get status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'running':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-background shadow-lg flex items-center justify-center animate-spin">
            <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full" />
          </div>
        );
      case 'success':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-green-500 border-2 border-background shadow-lg flex items-center justify-center">
            <CheckCircle2 className="w-3 h-3 text-white" />
          </div>
        );
      case 'error':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 border-2 border-background shadow-lg flex items-center justify-center" title={errorMessage}>
            <XCircle className="w-3 h-3 text-white" />
          </div>
        );
      case 'warning':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-500 border-2 border-background shadow-lg flex items-center justify-center">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        );
      case 'missing-integration':
        return (
          <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-orange-500 border-2 border-background shadow-lg flex items-center justify-center" title="Integration not configured">
            <Link2 className="w-3 h-3 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const getResourceInfo = () => {
    if (!data.config) return null;

    const info = data.config.formName ||
      data.config.spreadsheetName ||
      data.config.sheetName ||
      data.config.calendarName ||
      data.config.formId ||
      data.config.courseName ||
      data.config.action?.replace(/_/g, ' ');

    if (!info) return null;

    return (
      <div className="mt-1.5 px-2 py-0.5 rounded bg-muted/50 text-[9px] font-medium text-muted-foreground uppercase tracking-tight truncate border border-border/30 inline-block max-w-[140px]">
        {String(info).length > 25 ? String(info).slice(0, 22) + '...' : info}
      </div>
    );
  };

  return (
    <div
      className={`relative group min-w-[260px] rounded-2xl bg-card/80 backdrop-blur-md border-[1.5px] transition-all duration-300 shadow-sm hover:shadow-xl ${getBorderClass()}`}
    >
      {/* Status Indicator */}
      {getStatusIndicator()}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-background !border-2 !border-muted-foreground/30 !-left-2 transition-all group-hover:!bg-primary group-hover:!border-primary group-hover:!scale-125"
      />

      <div className="flex items-center p-3.5 gap-4">
        {/* Icon Box */}
        <div className={`p-3 rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${getNodeColor(data.nodeType)}`}>
          {getNodeIcon(data.nodeType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate text-card-foreground tracking-tight">
            {data.label}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5">
            <Zap className="w-2.5 h-2.5 text-primary/40" />
            {data.nodeType.replace(/-/g, ' ')}
          </div>

          {getResourceInfo()}

          {/* Show error message if exists */}
          {status === 'error' && errorMessage && (
            <div className="text-[10px] text-red-500/80 font-medium truncate mt-1 flex items-center gap-1" title={errorMessage}>
              <XCircle className="w-2.5 h-2.5" />
              {errorMessage.slice(0, 30)}...
            </div>
          )}
          {/* Show missing integration warning */}
          {!hasIntegration && (
            <div className="text-[10px] text-orange-500 font-bold truncate mt-1 flex items-center gap-1">
              <Link2 className="w-2.5 h-2.5" />
              Integration Required
            </div>
          )}
        </div>
      </div>
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-background !border-2 !border-muted-foreground/30 !-right-2 transition-all group-hover:!bg-primary group-hover:!border-primary group-hover:!scale-125"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const nodePalette = [
  {
    category: "Triggers",
    items: [
      { type: "trigger-webhook", label: "Webhook Trigger", icon: Webhook, description: "HTTP webhook" },
      { type: "trigger-form", label: "Form Submission", icon: FormInput, description: "On form submit" },
      { type: "trigger-email", label: "Email Received", icon: Mail, description: "Incoming email" },
    ]
  },
  {
    category: "Google Suite",
    items: [
      { type: "google-classroom", label: "Google Classroom", icon: GraduationCap, description: "Manage classes" },
      { type: "google-drive", label: "Google Drive", icon: FolderOpen, description: "Files & folders" },
      { type: "google-sheets", label: "Google Sheets", icon: Sheet, description: "Spreadsheet data" },
      { type: "google-calendar", label: "Google Calendar", icon: Calendar, description: "Events & schedules" },
      { type: "google-meet", label: "Google Meet", icon: Video, description: "Video meetings" },
      { type: "google-forms", label: "Google Forms", icon: FormInput, description: "Forms & surveys" },
    ]
  },
  {
    category: "LMS Platforms",
    items: [
      { type: "moodle", label: "Moodle", icon: GraduationCap, description: "Learning management" },
      { type: "canvas-lms", label: "Canvas LMS", icon: BookOpen, description: "Course management" },
      { type: "schoology", label: "Schoology", icon: BookOpen, description: "School management" },
    ]
  },
  {
    category: "Communication",
    items: [
      { type: "whatsapp-group", label: "WhatsApp Group", icon: Users, description: "Send to group" },
      { type: "alert-send", label: "Multi-Channel Alert", icon: Bell, description: "WhatsApp, Email, SMS" },
      { type: "twilio-sms", label: "Send SMS", icon: Phone, description: "Via Twilio" },
      { type: "email-send", label: "Send Email", icon: Mail, description: "Via SMTP" },
      { type: "slack-send", label: "Slack Message", icon: Slack, description: "Post to channel" },
      { type: "discord-send", label: "Discord Message", icon: MessageCircle, description: "Send to Discord" },
    ]
  },
  {
    category: "Video & Meetings",
    items: [
      { type: "zoom-meeting", label: "Zoom Meeting", icon: Video, description: "Create/join meeting" },
      { type: "zoom-recording", label: "Zoom Recording", icon: Video, description: "Get recordings" },
    ]
  },
  {
    category: "Education",
    items: [
      { type: "attendance-track", label: "Track Attendance", icon: ClipboardCheck, description: "Monitor attendance" },
      { type: "assignment-create", label: "Create Assignment", icon: FileText, description: "Distribute tasks" },
      { type: "schedule-check", label: "Check Schedule", icon: Calendar, description: "Class reminders" },
      { type: "grade-calculate", label: "Calculate Grades", icon: Award, description: "Grade computation" },
      { type: "student-notify", label: "Notify Students", icon: UserCheck, description: "Student alerts" },
      { type: "quiz-create", label: "Create Quiz", icon: CheckSquare, description: "Build quizzes" },
      { type: "report-generate", label: "Generate Report", icon: BarChart3, description: "Progress reports" },
    ]
  },
  {
    category: "Grading & Assessment",
    items: [
      { type: "turnitin", label: "Turnitin", icon: ClipboardCheck, description: "Plagiarism check" },
      { type: "gradescope", label: "Gradescope", icon: PenTool, description: "AI-assisted grading" },
      { type: "kahoot", label: "Kahoot!", icon: Brain, description: "Quiz results" },
    ]
  },
  {
    category: "AI & Analytics",
    items: [
      { type: "power-bi", label: "Power BI", icon: BarChart3, description: "Data visualization" },
      { type: "local-ai", label: "AI Analysis", icon: Brain, description: "Analyze content" },
      { type: "ai-summarize", label: "AI Summarize", icon: Sparkles, description: "Summarize text" },
      { type: "ai-translate", label: "AI Translate", icon: Globe, description: "Language translation" },
      { type: "ai-sentiment", label: "Sentiment Analysis", icon: Bot, description: "Analyze sentiment" },
      { type: "analytics-track", label: "Track Analytics", icon: PieChart, description: "Usage analytics" },
      { type: "chart-generate", label: "Generate Chart", icon: TrendingUp, description: "Data visualization" },
    ]
  },
  {
    category: "Data & Storage",
    items: [
      { type: "database-query", label: "Database Query", icon: Database, description: "Query database" },
      { type: "spreadsheet-update", label: "Update Spreadsheet", icon: Sheet, description: "Modify cells" },
      { type: "file-read", label: "Read File", icon: FileText, description: "Read file data" },
      { type: "file-write", label: "Write File", icon: HardDrive, description: "Save to file" },
      { type: "json-parse", label: "Parse JSON", icon: FileJson, description: "Process JSON" },
    ]
  },
  {
    category: "Logic & Utility",
    items: [
      { type: "delay", label: "Delay", icon: Clock, description: "Wait for duration" },
      { type: "condition", label: "Condition", icon: GitBranch, description: "If/Else logic" },
      { type: "loop", label: "Loop", icon: Repeat, description: "Iterate items" },
      { type: "filter", label: "Filter", icon: Filter, description: "Filter data" },
      { type: "split", label: "Split", icon: Split, description: "Split workflow" },
      { type: "merge", label: "Merge", icon: Merge, description: "Merge branches" },
      { type: "transform", label: "Transform Data", icon: Code, description: "Modify data" },
      { type: "http-request", label: "HTTP Request", icon: Globe, description: "External API" },
    ]
  }
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("palette");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'default', animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setRightPanelTab("properties");
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setRightPanelTab("palette");
  }, []);

  const addNode = (nodeType: string, label: string) => {
    const getDefaultConfig = (type: string) => {
      switch (type) {
        // Triggers
        case "trigger-schedule":
          return { cronExpression: "0 9 * * *", timezone: "UTC", description: "Run every day at 9 AM" };
        case "trigger-webhook":
          return { path: "/webhook/my-trigger", method: "POST", secret: "" };
        case "trigger-form":
          return { formId: "", fields: [] };
        case "trigger-email":
          return { fromFilter: "", subjectFilter: "", folder: "INBOX" };

        // Google Suite
        case "google-classroom":
          return { action: "list-courses", courseId: "", announcementText: "" };
        case "google-drive":
          return { action: "list-files", folderId: "", fileName: "" };
        case "google-sheets":
          return { spreadsheetId: "", sheetName: "Sheet1", range: "A1:Z100", action: "read" };
        case "google-calendar":
          return { calendarId: "primary", action: "list-events", eventTitle: "", startDate: "", endDate: "" };
        case "google-meet":
          return { action: "create", title: "Meeting", duration: 60, attendees: "" };
        case "google-forms":
          return { formId: "", action: "get-responses" };

        // LMS Platforms
        case "moodle":
        case "canvas-lms":
        case "schoology":
          return { action: "list-courses", courseId: "", apiKey: "" };

        // Grading & Assessment
        case "turnitin":
          return { action: "check-plagiarism", submissionId: "", apiKey: "" };
        case "gradescope":
          return { action: "grade-submission", submissionId: "", apiKey: "" };
        case "kahoot":
          return { action: "get-results", quizId: "", apiKey: "" };

        // Analytics
        case "power-bi":
          return { action: "refresh-dataset", datasetId: "", apiKey: "" };

        // Communication
        case "whatsapp-group":
          return {
            sendToGroup: false, // Enable to send to WhatsApp group by name
            to: "", // For individual recipients (Twilio)
            groupName: "", // For group messaging (WhatsApp Web)
            groupLink: "", // Reference only
            message: "Hello everyone!",
            messageTemplate: "general",
            templateVars: {},
            sendAt: "",
            formatBold: false,
            formatItalic: false,
            includeLink: false,
            linkUrl: "",
            linkText: ""
          };
        case "alert-send":
          return { channels: ["whatsapp", "email"], title: "Alert", recipients: "test@example.com", message: "Something happened!", priority: "normal" };
        case "twilio-sms":
          return { to: "+1234567890", message: "Hello!" };
        case "email-send":
          return { to: "test@example.com", subject: "Test", body: "Hello!" };
        case "slack-send":
          return { channel: "#general", message: "", username: "EduFlow Bot" };
        case "discord-send":
          return { webhookUrl: "", message: "", username: "EduFlow Bot" };

        // Video & Meetings
        case "zoom-meeting":
          return { action: "create", topic: "Meeting", duration: 60, password: "", waitingRoom: true };
        case "zoom-recording":
          return { meetingId: "", action: "list" };

        // Education
        case "attendance-track":
          return { threshold: 75, action: "alert", classId: "" };
        case "assignment-create":
          return { title: "New Assignment", description: "Please complete by Friday", dueDate: new Date().toISOString().split('T')[0], points: 100 };
        case "schedule-check":
          return { reminderMinutes: 15, date: "" };
        case "grade-calculate":
          return { formula: "average", weights: { assignments: 40, quizzes: 30, exams: 30 } };
        case "student-notify":
          return { recipientType: "all", message: "", channels: ["email"] };
        case "quiz-create":
          return { title: "New Quiz", questions: [], timeLimit: 30, attempts: 1 };
        case "report-generate":
          return { reportType: "progress", format: "pdf", includeCharts: true };

        // AI & Analytics
        case "local-ai":
          return { mode: "analysis", prompt: "" };
        case "ai-summarize":
          return { maxLength: 200, style: "bullet-points" };
        case "ai-translate":
          return { sourceLang: "auto", targetLang: "en" };
        case "ai-sentiment":
          return { detailed: true };
        case "analytics-track":
          return { event: "", properties: {} };
        case "chart-generate":
          return { chartType: "bar", title: "", dataSource: "" };

        // Data & Storage
        case "database-query":
          return { query: "", database: "default", timeout: 30000 };
        case "spreadsheet-update":
          return { spreadsheetId: "", range: "A1", values: [[]] };
        case "file-read":
          return { path: "", encoding: "utf-8" };
        case "file-write":
          return { path: "", content: "", append: false };
        case "json-parse":
          return { inputPath: "", outputPath: "" };

        // Logic & Utility
        case "delay":
          return { duration: 5, unit: "seconds" };
        case "condition":
          return { field: "", operator: "equals", value: "" };
        case "loop":
          return { items: "", maxIterations: 100 };
        case "filter":
          return { field: "", operator: "equals", value: "" };
        case "split":
          return { branches: 2 };
        case "merge":
          return { mode: "wait-all" };
        case "transform":
          return { expression: "", outputField: "result" };
        case "http-request":
          return { url: "", method: "GET", headers: "{}", body: "" };

        default:
          return {};
      }
    };

    const newNode: Node = {
      id: `${nodeType}-${Date.now()}`,
      type: "custom",
      position: { x: 250 + Math.random() * 100, y: 100 + Math.random() * 100 },
      data: {
        label: label,
        nodeType,
        config: getDefaultConfig(nodeType),
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast({
      title: "Node Added",
      description: `Added ${label} to canvas`,
    });
  };

  const handleSave = async () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a workflow name',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
          enabled: true,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: 'Success',
          description: 'Workflow saved successfully',
        });
        router.push(`/dashboard/workflows/${data.data.id}`);
      } else {
        throw new Error(data.error || 'Failed to save workflow');
      }
    } catch (error) {
      console.error("Failed to save workflow:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a workflow name',
        variant: 'destructive',
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one node to the workflow',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);
    try {
      // Save first
      const saveResponse = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workflowName,
          nodes,
          edges,
          enabled: true,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveData.ok) {
        throw new Error(saveData.error || 'Failed to save workflow');
      }

      // Then execute
      const runResponse = await fetch(
        `/api/workflows/${saveData.data.id}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const runData = await runResponse.json();

      if (runData.ok) {
        toast({
          title: 'Success',
          description: 'Workflow is running',
        });
        // Navigate to the run detail page
        router.push(
          `/dashboard/workflows/${saveData.data.id}/runs/${runData.data.runId}`
        );
      } else {
        throw new Error(runData.error || 'Failed to execute workflow');
      }
    } catch (error) {
      console.error("Failed to run workflow:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to run workflow',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const defaultEdgeOptions = {
    type: 'default',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#b1b1b7',
    },
    style: {
      strokeWidth: 2,
      stroke: '#b1b1b7',
    },
    animated: true,
  };

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/workflows">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto p-0 bg-transparent"
              placeholder="Enter workflow name"
            />
            <span className="text-xs text-muted-foreground">
              {nodes.length} nodes • {edges.length} connections
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || isRunning}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={handleRun}
            disabled={isSaving || isRunning || nodes.length === 0}
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? "Running..." : "Save & Run"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative bg-muted/5">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineType={ConnectionLineType.Bezier}
            fitView
            className="workflow-canvas"
          >
            <Background color="#94a3b8" gap={16} size={1} />
            <Controls className="bg-background border-border shadow-sm" />
            <MiniMap
              className="bg-background border-border shadow-sm rounded-lg overflow-hidden"
              nodeColor={(n) => {
                if (n.type === 'custom') return '#3b82f6';
                return '#e2e8f0';
              }}
            />
          </ReactFlow>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-background border-l border-border flex flex-col shadow-xl z-20 h-full overflow-hidden">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="px-4 pt-4 pb-2 border-b border-border flex-shrink-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="palette" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Node
                </TabsTrigger>
                <TabsTrigger value="properties" disabled={!selectedNode} className="gap-2">
                  <Settings2 className="w-4 h-4" /> Properties
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="palette" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {nodePalette.map((category) => (
                    <div key={category.category}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                        {category.category}
                      </h4>
                      <div className="grid gap-2">
                        {category.items.map((node) => (
                          <div
                            key={node.type}
                            onClick={() => addNode(node.type, node.label)}
                            className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200"
                          >
                            <div className="p-2 rounded-md bg-muted group-hover:bg-background transition-colors">
                              <node.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground">{node.label}</div>
                              <div className="text-xs text-muted-foreground">{node.description}</div>
                            </div>
                            <Plus className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 m-0 overflow-hidden data-[state=inactive]:hidden">
              {selectedNode ? (
                <NodePropertiesPanel
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdate={(config) => {
                    setNodes((nds) =>
                      nds.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, config } }
                          : node
                      )
                    );
                  }}
                  onClose={() => {
                    setSelectedNode(null);
                    setRightPanelTab("palette");
                  }}
                  onDelete={() => {
                    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
                    setSelectedNode(null);
                    setRightPanelTab("palette");
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6 text-muted-foreground">
                  <Zap className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select a node on the canvas to configure its properties.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function NodePropertiesPanel({
  node,
  onUpdate,
  onClose,
  onDelete
}: {
  node: Node;
  onUpdate: (config: any) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [config, setConfig] = useState<any>(() => node.data.config || {});

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev, [key]: value };
      requestAnimationFrame(() => {
        onUpdate(newConfig);
      });

      // Auto-fetch responses when formId changes
      if (key === 'formId' && value && (node.data.nodeType === 'google-forms' || node.data.nodeType === 'trigger-form')) {
        fetchRecentResponses(value);
      }

      return newConfig;
    });
  };

  const { toast } = useToast();
  const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Google Sheets specific states
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [isFetchingSheets, setIsFetchingSheets] = useState(false);
  const [spreadsheetName, setSpreadsheetName] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [recentSheets, setRecentSheets] = useState<any[]>([]);
  const [isFetchingRecentSheets, setIsFetchingRecentSheets] = useState(false);

  // Google Classroom specific states
  const [courses, setCourses] = useState<any[]>([]);
  const [isFetchingCourses, setIsFetchingCourses] = useState(false);
  const [classroomError, setClassroomError] = useState<string | null>(null);

  // Google Drive specific states
  const [recentDriveFiles, setRecentDriveFiles] = useState<any[]>([]);
  const [isFetchingDriveFiles, setIsFetchingDriveFiles] = useState(false);

  // Google Calendar specific states
  const [recentCalendars, setRecentCalendars] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isFetchingCalendars, setIsFetchingCalendars] = useState(false);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);

  // Google Forms specific states
  const [recentForms, setRecentForms] = useState<any[]>([]);
  const [isFetchingForms, setIsFetchingForms] = useState(false);
  const [recentResponses, setRecentResponses] = useState<any[]>([]);
  const [formQuestions, setFormQuestions] = useState<Record<string, string>>({});
  const [isFetchingResponses, setIsFetchingResponses] = useState(false);

  const fetchClassroomMetadata = useCallback(async () => {
    setIsFetchingCourses(true);
    setClassroomError(null);
    try {
      const res = await fetch('/api/integrations/google/classroom/metadata');
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
      } else if (data.error) {
        setClassroomError(data.error);
      }
    } catch (error) {
      console.error("Failed to fetch classroom metadata:", error);
      setClassroomError("Connection failed");
    } finally {
      setIsFetchingCourses(false);
    }
  }, []);

  const fetchRecentSheets = useCallback(async () => {
    setIsFetchingRecentSheets(true);
    try {
      const res = await fetch('/api/integrations/google/sheets/list');
      const data = await res.json();
      if (data.files) {
        setRecentSheets(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch recent sheets:", error);
    } finally {
      setIsFetchingRecentSheets(false);
    }
  }, []);

  const fetchRecentDriveFiles = useCallback(async () => {
    setIsFetchingDriveFiles(true);
    try {
      const res = await fetch('/api/integrations/google/drive/list');
      const data = await res.json();
      if (data.files) {
        setRecentDriveFiles(data.files);
      }
    } catch (error) {
      console.error("Failed to fetch recent drive files:", error);
    } finally {
      setIsFetchingDriveFiles(false);
    }
  }, []);

  const fetchRecentCalendars = useCallback(async () => {
    setIsFetchingCalendars(true);
    try {
      const res = await fetch('/api/integrations/google/calendar/list');
      const data = await res.json();
      if (data.calendars) {
        setRecentCalendars(data.calendars);
      }
    } catch (error) {
      console.error("Failed to fetch calendars:", error);
    } finally {
      setIsFetchingCalendars(false);
    }
  }, []);

  const fetchRecentEvents = useCallback(async (calId: string) => {
    if (!calId) return;
    setIsFetchingEvents(true);
    try {
      const res = await fetch(`/api/integrations/google/calendar/events?calendarId=${encodeURIComponent(calId)}`);
      const data = await res.json();
      if (data.events) {
        setRecentEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsFetchingEvents(false);
    }
  }, []);

  const fetchRecentForms = useCallback(async () => {
    setIsFetchingForms(true);
    try {
      const res = await fetch('/api/integrations/google/forms/list');
      const data = await res.json();
      if (data.forms) {
        setRecentForms(data.forms);
      }
    } catch (error) {
      console.error("Failed to fetch recent forms:", error);
    } finally {
      setIsFetchingForms(false);
    }
  }, []);

  const fetchRecentResponses = useCallback(async (formId: string) => {
    if (!formId || formId.includes('/d/')) return;
    setIsFetchingResponses(true);
    try {
      const res = await fetch(`/api/integrations/google/forms/responses?formId=${encodeURIComponent(formId)}`);
      const data = await res.json();
      if (data.responses) {
        setRecentResponses(data.responses);
        setFormQuestions(data.questions || {});
      }
    } catch (error) {
      console.error("Failed to fetch recent responses:", error);
    } finally {
      setIsFetchingResponses(false);
    }
  }, []);

  useEffect(() => {
    if (node.data.nodeType === 'google-sheets') {
      fetchRecentSheets();
    }
    if (node.data.nodeType === 'google-classroom') {
      fetchClassroomMetadata();
    }
    if (node.data.nodeType === 'google-drive') {
      fetchRecentDriveFiles();
    }
    if (node.data.nodeType === 'google-calendar') {
      fetchRecentCalendars();
      if (config.calendarId) {
        fetchRecentEvents(config.calendarId);
      }
    }
    if (node.data.nodeType === 'google-forms' || node.data.nodeType === 'trigger-form') {
      fetchRecentForms();
      if (config.formId) {
        fetchRecentResponses(config.formId);
      }
    }
  }, [node.data.nodeType, fetchClassroomMetadata, fetchRecentSheets, fetchRecentDriveFiles, fetchRecentCalendars, fetchRecentEvents, fetchRecentForms, fetchRecentResponses, config.calendarId, config.formId]);

  const fetchSheetMetadata = useCallback(async (id: string) => {
    if (!id || id === '' || id === 'auto') {
      setSheetNames([]);
      setSpreadsheetName(null);
      setSheetError(null);
      return;
    }

    setIsFetchingSheets(true);
    setSheetError(null);
    try {
      const res = await fetch(`/api/integrations/google/sheets/metadata?spreadsheetId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.sheetNames) {
        setSheetNames(data.sheetNames);
        setSpreadsheetName(data.spreadsheetName);

        // If the API extracted a clean ID from a URL, update it in the config
        if (data.spreadsheetId && data.spreadsheetId !== id) {
          handleConfigChange("spreadsheetId", data.spreadsheetId);
        }

        // If no sheet is selected, default to the first one
        if (!config.sheetName && data.sheetNames.length > 0) {
          handleConfigChange("sheetName", data.sheetNames[0]);
        }
      } else if (data.error) {
        console.warn("[Meta Fetched] Error:", data.error);
        setSheetError(data.error);
        setSpreadsheetName(null);
        setSheetNames([]);
      }
    } catch (error) {
      console.error("Failed to fetch sheet metadata:", error);
      setSheetError("Failed to verify ID");
    } finally {
      setIsFetchingSheets(false);
    }
  }, [config.sheetName, handleConfigChange]);

  useEffect(() => {
    if (node.data.nodeType === 'google-sheets' && config.spreadsheetId) {
      const timer = setTimeout(() => {
        fetchSheetMetadata(config.spreadsheetId);
      }, 800); // Debounce to avoid too many requests while typing
      return () => clearTimeout(timer);
    }
  }, [config.spreadsheetId, node.data.nodeType, fetchSheetMetadata]);

  const fetchWhatsAppGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/whatsapp-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-groups' })
      });
      const data = await res.json();
      if (data.ok) {
        setWhatsappGroups(data.groups);
        toast({ description: `Fetched ${data.count} groups` });
      } else {
        toast({ description: "Failed to fetch groups", variant: "destructive" });
      }
    } catch (error) {
      toast({ description: "Error fetching groups", variant: "destructive" });
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const renderConfigFields = () => {
    switch (node.data.nodeType) {
      case "whatsapp-group":
        const messageTemplates = {
          general: "Hello everyone! 👋",
          assignment: "📚 *New Assignment Alert*\n\nSubject: {subject}\nTitle: {title}\nDue Date: {dueDate}\n\nPlease submit on time!",
          attendance: "📊 *Attendance Update*\n\nDate: {date}\nPresent: {present}\nAbsent: {absent}\n\nPlease ensure regular attendance.",
          exam: "📝 *Exam Notice*\n\nSubject: {subject}\nDate: {date}\nTime: {time}\nVenue: {venue}\n\nAll the best!",
          holiday: "🎉 *Holiday Notice*\n\nDate: {date}\nReason: {reason}\n\nEnjoy your day off!",
          meeting: "🤝 *Meeting Notice*\n\nTopic: {topic}\nDate: {date}\nTime: {time}\nLink: {link}",
          result: "🎓 *Result Announcement*\n\nSubject: {subject}\nResults are now available.\n\nCheck the portal for details."
        };

        const getPreviewMessage = () => {
          let template = messageTemplates[config.messageTemplate as keyof typeof messageTemplates] || config.message || "";
          if (config.formatBold) template = `*${template}*`;
          if (config.formatItalic) template = `_${template}_`;
          if (config.includeLink && config.linkUrl) {
            template += `\n\n🔗 ${config.linkText || 'Click Here'}: ${config.linkUrl}`;
          }
          return template;
        };

        return (
          <>
            {/* Mode Selection */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg mb-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">Send to WhatsApp Group</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sendToGroup || false}
                    onChange={(e) => handleConfigChange("sendToGroup", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
              <p className="text-xs text-green-600 dark:text-green-500">
                {config.sendToGroup
                  ? "✅ Will send to WhatsApp group using WhatsApp Web (requires connection)"
                  : "📱 Will send to individual phones using Twilio"
                }
              </p>
            </div>

            {config.sendToGroup ? (
              // Group Mode (WhatsApp Web)
              <>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    <strong>📋 Setup Required:</strong> Go to Settings → Integrations → WhatsApp Web and scan the QR code to connect.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Label htmlFor="groupName" className="text-green-700 dark:text-green-400 font-semibold">
                    📱 Group Name (REQUIRED)
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={config.groupName || ""}
                      onValueChange={(val) => handleConfigChange("groupName", val)}
                    >
                      <SelectTrigger className="flex-1 border-green-300 dark:border-green-700 bg-white dark:bg-black/20">
                        <SelectValue placeholder="Select a group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappGroups.length === 0 && (
                          <div className="p-2 text-xs text-muted-foreground text-center">
                            No groups loaded. Click refresh button.
                          </div>
                        )}
                        {whatsappGroups.map((g: any) => (
                          <SelectItem key={g.id} value={g.name}>
                            {g.name} <span className="text-muted-foreground text-xs">({g.participants})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchWhatsAppGroups}
                      disabled={isLoadingGroups}
                      className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                      title="Fetch WhatsApp Groups"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingGroups ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Select the group from the list. Make sure you are connected in Integrations.
                  </p>
                </div>
              </>
            ) : (
              // Individual Mode (Twilio)
              <>
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Label htmlFor="to" className="text-blue-700 dark:text-blue-400 font-semibold">
                    📱 Recipients (Phone Numbers)
                  </Label>
                  <Input
                    id="to"
                    placeholder="+919876543210, +918765432109"
                    value={config.to || ""}
                    onChange={(e) => handleConfigChange("to", e.target.value)}
                    className="border-blue-300 dark:border-blue-700"
                  />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Comma-separated phone numbers with country code (e.g., +91 for India)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name (Label)</Label>
                  <Input
                    id="groupName"
                    placeholder="Class 12A Students"
                    value={config.groupName || ""}
                    onChange={(e) => handleConfigChange("groupName", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional label for organizing your contacts
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="groupLink">Group Invite Link (Reference)</Label>
              <Input
                id="groupLink"
                placeholder="https://chat.whatsapp.com/ABC123xyz..."
                value={config.groupLink || ""}
                onChange={(e) => handleConfigChange("groupLink", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Save your group link for reference (not used for sending)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageTemplate">Message Template</Label>
              <Select
                value={config.messageTemplate || "general"}
                onValueChange={(value) => {
                  handleConfigChange("messageTemplate", value);
                  handleConfigChange("message", messageTemplates[value as keyof typeof messageTemplates]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">📢 General Announcement</SelectItem>
                  <SelectItem value="assignment">📚 Assignment Notice</SelectItem>
                  <SelectItem value="attendance">📊 Attendance Update</SelectItem>
                  <SelectItem value="exam">📝 Exam Notice</SelectItem>
                  <SelectItem value="holiday">🎉 Holiday Notice</SelectItem>
                  <SelectItem value="meeting">🤝 Meeting Notice</SelectItem>
                  <SelectItem value="result">🎓 Result Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message Content</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={5}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{variable}"} for dynamic content. *bold*, _italic_
              </p>
            </div>

            {/* Formatting Options */}
            <div className="space-y-2">
              <Label>Formatting Options</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={config.formatBold ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConfigChange("formatBold", !config.formatBold)}
                >
                  <strong>B</strong>
                </Button>
                <Button
                  type="button"
                  variant={config.formatItalic ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleConfigChange("formatItalic", !config.formatItalic)}
                >
                  <em>I</em>
                </Button>
              </div>
            </div>

            {/* Include Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeLink"
                  checked={config.includeLink || false}
                  onChange={(e) => handleConfigChange("includeLink", e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="includeLink">Include a Link</Label>
              </div>
              {config.includeLink && (
                <div className="pl-6 space-y-2">
                  <Input
                    placeholder="https://example.com/assignment"
                    value={config.linkUrl || ""}
                    onChange={(e) => handleConfigChange("linkUrl", e.target.value)}
                  />
                  <Input
                    placeholder="Link Text (e.g., View Assignment)"
                    value={config.linkText || ""}
                    onChange={(e) => handleConfigChange("linkText", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Schedule Send */}
            <div className="space-y-2">
              <Label htmlFor="sendAt">Schedule Send (Optional)</Label>
              <Input
                id="sendAt"
                type="datetime-local"
                value={config.sendAt || ""}
                onChange={(e) => handleConfigChange("sendAt", e.target.value)}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    {(config.groupName || "Group").charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{config.groupName || "College Group"}</p>
                    <p className="text-xs text-muted-foreground">You</p>
                  </div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg ml-10">
                  <p className="text-sm whitespace-pre-wrap">{getPreviewMessage()}</p>
                </div>
              </div>
            </div>
          </>
        );
      case "alert-send":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Alert Title</Label>
              <Input
                id="title"
                placeholder="Important Alert"
                value={config.title || ""}
                onChange={(e) => handleConfigChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients</Label>
              <Textarea
                id="recipients"
                placeholder="+1234567890, email@example.com"
                value={config.recipients || ""}
                onChange={(e) => handleConfigChange("recipients", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Alert message"
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={config.priority || "normal"}
                onValueChange={(value) => handleConfigChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "attendance-track":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="threshold">Attendance Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                placeholder="75"
                value={config.threshold || ""}
                onChange={(e) => handleConfigChange("threshold", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classId">Class ID (Optional)</Label>
              <Input
                id="classId"
                placeholder="All Classes"
                value={config.classId || ""}
                onChange={(e) => handleConfigChange("classId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action on Low Attendance</Label>
              <Select
                value={config.action || "alert"}
                onValueChange={(value) => handleConfigChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">Send Alert</SelectItem>
                  <SelectItem value="report">Generate Report</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "assignment-create":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                placeholder="Math Homework"
                value={config.title || ""}
                onChange={(e) => handleConfigChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={config.dueDate || ""}
                onChange={(e) => handleConfigChange("dueDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Assignment details"
                value={config.description || ""}
                onChange={(e) => handleConfigChange("description", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "schedule-check":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="reminderMinutes">Reminder (Minutes Before)</Label>
              <Input
                id="reminderMinutes"
                type="number"
                placeholder="15"
                value={config.reminderMinutes || ""}
                onChange={(e) => handleConfigChange("reminderMinutes", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={config.date || ""}
                onChange={(e) => handleConfigChange("date", e.target.value)}
              />
            </div>
          </>
        );
      case "twilio-sms":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">Phone Number</Label>
              <Input
                id="to"
                placeholder="+1234567890"
                value={config.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message"
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "email-send":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">Email Address</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={config.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={config.subject || ""}
                onChange={(e) => handleConfigChange("subject", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Email body"
                value={config.body || ""}
                onChange={(e) => handleConfigChange("body", e.target.value)}
                rows={5}
              />
            </div>
          </>
        );
      case "delay":
        return (
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="30"
              value={config.duration || ""}
              onChange={(e) =>
                handleConfigChange("duration", parseInt(e.target.value) || 0)
              }
            />
          </div>
        );
      case "condition":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Input
                id="field"
                placeholder="input.field"
                value={config.field || ""}
                onChange={(e) => handleConfigChange("field", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={config.operator || ""}
                onValueChange={(value) => handleConfigChange("operator", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not-equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not-contains">Not Contains</SelectItem>
                  <SelectItem value="greater-than">Greater Than</SelectItem>
                  <SelectItem value="less-than">Less Than</SelectItem>
                  <SelectItem value="exists">Exists</SelectItem>
                  <SelectItem value="not-exists">Not Exists</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                placeholder="Value to compare"
                value={config.value || ""}
                onChange={(e) => handleConfigChange("value", e.target.value)}
              />
            </div>
          </>
        );
      case "local-ai":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                placeholder="Text to analyze"
                value={config.text || ""}
                onChange={(e) => handleConfigChange("text", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode</Label>
              <Select
                value={config.mode || ""}
                onValueChange={(value) => handleConfigChange("mode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                  <SelectItem value="summary">Summarization</SelectItem>
                  <SelectItem value="extraction">Key Point Extraction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "http-request":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/data"
                value={config.url || ""}
                onChange={(e) => handleConfigChange("url", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={config.method || "GET"}
                onValueChange={(value) => handleConfigChange("method", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                placeholder='{"Content-Type": "application/json"}'
                value={config.headers || ""}
                onChange={(e) => handleConfigChange("headers", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body (JSON)</Label>
              <Textarea
                id="body"
                placeholder='{"key": "value"}'
                value={config.body || ""}
                onChange={(e) => handleConfigChange("body", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      // Triggers
      case "trigger-schedule":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="cronExpression">Cron Expression</Label>
              <Input
                id="cronExpression"
                placeholder="0 9 * * *"
                value={config.cronExpression || ""}
                onChange={(e) => handleConfigChange("cronExpression", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">E.g., "0 9 * * *" = Every day at 9 AM</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={config.timezone || "UTC"}
                onValueChange={(value) => handleConfigChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "trigger-webhook":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="path">Webhook Path</Label>
              <Input
                id="path"
                placeholder="/webhook/my-trigger"
                value={config.path || ""}
                onChange={(e) => handleConfigChange("path", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={config.method || "POST"}
                onValueChange={(value) => handleConfigChange("method", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "trigger-form":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="formId">Google Form</Label>
              <div className="flex gap-2">
                <Input
                  id="formId"
                  placeholder="Paste Form ID or URL..."
                  value={config.formId || ""}
                  onChange={(e) => handleConfigChange("formId", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchRecentForms}
                  disabled={isFetchingForms}
                  title="Reload Forms"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingForms ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="mt-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> FORM BROWSER
                  </h4>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 thin-scrollbar">
                  {recentForms.length > 0 ? (
                    recentForms.map((form) => (
                      <div
                        key={form.id}
                        className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${config.formId === form.id
                          ? 'bg-white dark:bg-slate-800 border-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-sm'
                          }`}
                        onClick={() => {
                          handleConfigChange("formId", form.id);
                          handleConfigChange("formName", form.name);
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                            {form.name}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-medium tracking-tight">
                            {new Date(form.modifiedTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <a
                          href={form.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary transition-all px-2 py-1 rounded-lg hover:bg-primary/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      </div>
                    ))
                  ) : !isFetchingForms ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <FormInput className="w-6 h-6 text-slate-300 mb-2" />
                      <p className="text-[10px] text-slate-500 font-medium">No forms available</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-2 rounded italic border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Tip: This trigger will run whenever someone submits the selected form.
            </p>

            {/* Visual Log Data */}
            {config.formId && (
              <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-500" />
                    Visual Log Data
                  </h4>
                  <Badge variant="outline" className="text-[9px] font-bold bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 border-blue-200/50 dark:border-blue-800/50 px-2 py-0">
                    {recentResponses.length} Responses
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 thin-scrollbar">
                  {isFetchingResponses ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary/30 mb-2" />
                      <p className="text-[10px] text-slate-500 font-medium">Tracking live data...</p>
                    </div>
                  ) : recentResponses.length > 0 ? (
                    <div className="relative pl-4 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800/50 after:absolute after:left-[4px] after:top-2 after:bottom-2 after:w-[8px] after:bg-transparent after:pointer-events-none">
                      {recentResponses.slice(0, 5).map((response, idx) => (
                        <div key={response.responseId || idx} className="relative">
                          <div className="absolute -left-[14px] top-1.5 w-[14px] h-[14px] rounded-full bg-white dark:bg-slate-950 border-2 border-primary/40 z-10 box-content shadow-sm" />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                Response Received
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(response.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:border-primary/20">
                              <div className="grid grid-cols-1 gap-1.5">
                                {Object.entries(response.answers || {}).slice(0, 2).map(([qId, ans]: [any, any]) => (
                                  <div key={qId} className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase">
                                      {formQuestions[qId] || "FIELD"}
                                    </span>
                                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate pl-1.5 border-l-2 border-slate-100 dark:border-slate-800">
                                      {ans.textAnswers?.answers?.[0]?.value || "No response"}
                                    </p>
                                  </div>
                                ))}
                                {Object.keys(response.answers || {}).length > 2 && (
                                  <p className="text-[8px] text-primary/60 font-medium italic pt-1 border-t border-slate-50 dark:border-slate-800 mt-1">
                                    + {Object.keys(response.answers || {}).length - 2} more fields captured
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] uppercase tracking-widest font-bold text-slate-400 hover:text-primary hover:bg-primary/5"
                          onClick={() => fetchRecentResponses(config.formId)}
                        >
                          <RefreshCw className={`w-3 h-3 mr-2 ${isFetchingResponses ? 'animate-spin' : ''}`} />
                          Sync Latest
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-full mb-3 shadow-inner">
                        <Activity className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium max-w-[150px] text-center">No recent activity found for this form.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case "trigger-email":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fromFilter">From Filter</Label>
              <Input
                id="fromFilter"
                placeholder="*@school.edu"
                value={config.fromFilter || ""}
                onChange={(e) => handleConfigChange("fromFilter", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subjectFilter">Subject Filter</Label>
              <Input
                id="subjectFilter"
                placeholder="Assignment Submission"
                value={config.subjectFilter || ""}
                onChange={(e) => handleConfigChange("subjectFilter", e.target.value)}
              />
            </div>
          </>
        );

      // Google Suite
      case "google-classroom":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={config.action || "list-courses"}
                onValueChange={(value) => handleConfigChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list-courses">List My Classes</SelectItem>
                  <SelectItem value="list-announcements">Fetch Class Posts</SelectItem>
                  <SelectItem value="post-announcement">Post Announcement</SelectItem>
                  <SelectItem value="create-coursework">New Assignment</SelectItem>
                  <SelectItem value="create-material">Add Material</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(config.action !== "list-courses" && config.action !== "create-course") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="courseId">Class Select</Label>
                  {isFetchingCourses && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                </div>
                {courses.length > 0 ? (
                  <Select
                    value={config.courseId || ""}
                    onValueChange={(value) => handleConfigChange("courseId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto-connect (Primary)</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name} {course.section ? `(${course.section})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="courseId"
                    placeholder="auto (uses your active class)"
                    value={config.courseId || ""}
                    onChange={(e) => handleConfigChange("courseId", e.target.value)}
                  />
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {classroomError ? (
                    <span className="text-destructive flex items-center gap-1">
                      <X className="w-3 h-3" /> Error: {classroomError}
                    </span>
                  ) : courses.length > 0
                    ? `✨ Found ${courses.length} active classes.`
                    : "Leave empty to auto-connect to your primary classroom."
                  }
                </p>
              </div>
            )}

            {config.action === "post-announcement" && (
              <div className="space-y-2">
                <Label htmlFor="announcementText">Announcement Text</Label>
                <Textarea
                  id="announcementText"
                  placeholder="Message to post to class stream..."
                  value={config.announcementText || ""}
                  onChange={(e) => handleConfigChange("announcementText", e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {(config.action === "create-coursework" || config.action === "create-material") && (
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter title"
                  value={config.title || ""}
                  onChange={(e) => handleConfigChange("title", e.target.value)}
                />
              </div>
            )}

            {(config.action === "create-coursework" || config.action === "create-material" || config.action === "create-course") && (
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details..."
                  value={config.description || ""}
                  onChange={(e) => handleConfigChange("description", e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {config.action === "create-coursework" && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={config.dueDate || ""}
                  onChange={(e) => handleConfigChange("dueDate", e.target.value)}
                />
              </div>
            )}

            {(config.action === "invite-student" || config.action === "invite-teacher") && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@school.edu"
                  value={config.email || ""}
                  onChange={(e) => handleConfigChange("email", e.target.value)}
                />
              </div>
            )}

            {courses.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <h5 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> Course Browser
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className={`p-2 rounded border text-xs cursor-pointer transition-all ${config.courseId === course.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-background hover:border-primary/50'
                        }`}
                      onClick={() => handleConfigChange("courseId", course.id)}
                    >
                      <div className="font-medium flex justify-between">
                        <span>{course.name}</span>
                        {course.alternateLink && (
                          <a
                            href={course.alternateLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline hover:text-primary/80"
                          >
                            🔗 Link
                          </a>
                        )}
                      </div>
                      {course.section && <div className="text-[10px] text-muted-foreground mt-0.5">{course.section}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      case "google-drive":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={config.action || "list-files"}
                onValueChange={(value) => handleConfigChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list-files">List My Files</SelectItem>
                  <SelectItem value="create-folder">Create New Folder</SelectItem>
                  <SelectItem value="delete-file">Remove Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="folderId">Parent Folder / Root</Label>
                <Input
                  id="folderId"
                  placeholder="auto or folder ID"
                  value={config.folderId || ""}
                  onChange={(e) => handleConfigChange("folderId", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">Use 'root' for your main Drive or leave 'auto'.</p>
              </div>

              {/* Drive File Browser */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> Recent Drive Items
                  </h4>
                  {isFetchingDriveFiles && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 thin-scrollbar">
                  {recentDriveFiles.length > 0 ? (
                    recentDriveFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          if (config.action === 'delete-file' || config.action === 'get-file') {
                            handleConfigChange("fileId", file.id);
                          } else {
                            handleConfigChange("folderId", file.id);
                          }
                        }}
                        className={`w-full text-left p-2 rounded-md transition-all flex items-center gap-2 group ${config.folderId === file.id || config.fileId === file.id
                          ? 'bg-primary/10 border-primary/20 border shadow-sm'
                          : 'hover:bg-background border border-transparent'
                          }`}
                      >
                        {file.iconLink ? (
                          <img src={file.iconLink} alt="" className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium truncate group-hover:text-primary transition-colors">
                              {file.name}
                            </p>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9px] text-primary hover:underline hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Open 🔗
                              </a>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground truncate uppercase">
                            {file.mimeType.split('.').pop() || 'Item'}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !isFetchingDriveFiles ? (
                    <p className="text-[10px] text-muted-foreground italic p-2">No items found.</p>
                  ) : null}
                </div>
                <p className="text-[9px] text-muted-foreground mt-2 italic px-1">
                  Click an item above to select it.
                </p>
              </div>

              {config.action === "create-folder" && (
                <div className="space-y-2">
                  <Label htmlFor="folderName">New Folder Name</Label>
                  <Input
                    id="folderName"
                    placeholder="Enter folder name..."
                    value={config.folderName || ""}
                    onChange={(e) => handleConfigChange("folderName", e.target.value)}
                  />
                </div>
              )}

              {config.action === "delete-file" && (
                <div className="space-y-2">
                  <Label htmlFor="fileId">Specific File ID</Label>
                  <Input
                    id="fileId"
                    placeholder="Select from browser or enter ID"
                    value={config.fileId || ""}
                    onChange={(e) => handleConfigChange("fileId", e.target.value)}
                  />
                </div>
              )}
            </div>
          </>
        );
      case "google-sheets":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={config.action || "read"}
                onValueChange={(value) => handleConfigChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Spreadsheet Data</SelectItem>
                  <SelectItem value="write">Update Entire Data</SelectItem>
                  <SelectItem value="append">Add New Row</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="spreadsheetId">Spreadsheet Select</Label>
                {isFetchingSheets && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
              </div>
              <Input
                id="spreadsheetId"
                placeholder="Paste ID or full spreadsheet URL..."
                value={config.spreadsheetId || ""}
                onChange={(e) => handleConfigChange("spreadsheetId", e.target.value)}
              />
              {spreadsheetName && (
                <p className="text-[10px] font-medium text-green-600 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Found: {spreadsheetName}
                </p>
              )}
              {sheetError && (
                <p className="text-[10px] font-medium text-destructive mt-1 flex items-center gap-1">
                  <X className="w-3 h-3" /> Error: {sheetError}
                </p>
              )}

              {/* Recent Spreadsheet Browser */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <FileSpreadsheet className="w-3 h-3" /> From your Drive
                  </h4>
                  {isFetchingRecentSheets && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 thin-scrollbar">
                  {recentSheets.length > 0 ? (
                    recentSheets.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => {
                          handleConfigChange("spreadsheetId", file.id);
                          setSpreadsheetName(file.name);
                          setSheetError(null);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-all flex items-center gap-2 group ${config.spreadsheetId === file.id
                          ? 'bg-primary/10 border-primary/20 border shadow-sm'
                          : 'hover:bg-background border border-transparent'
                          }`}
                      >
                        {file.iconLink ? (
                          <img src={file.iconLink} alt="" className="w-4 h-4" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium truncate group-hover:text-primary transition-colors">
                              {file.name}
                            </p>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9px] text-primary hover:underline hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Open 🔗
                              </a>
                            )}
                          </div>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {file.mimeType.split('.').pop()?.replace('spreadsheet', 'Sheet') || 'File'}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !isFetchingRecentSheets ? (
                    <p className="text-[10px] text-muted-foreground italic p-2">No spreadsheets found recently.</p>
                  ) : null}
                </div>
                <p className="text-[9px] text-muted-foreground mt-2 italic px-1">
                  Click a file above to select it instantly.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="range">Sheet & Range</Label>
              <div className="flex gap-2">
                {sheetNames.length > 0 ? (
                  <Select
                    value={config.sheetName || ""}
                    onValueChange={(value) => handleConfigChange("sheetName", value)}
                  >
                    <SelectTrigger className="w-1/3">
                      <SelectValue placeholder="Sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetNames.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="sheetName"
                    placeholder="Sheet1"
                    className="w-1/3"
                    value={config.sheetName || ""}
                    onChange={(e) => handleConfigChange("sheetName", e.target.value)}
                  />
                )}
                <Input
                  id="range"
                  placeholder="A1:Z100"
                  className="flex-1"
                  value={config.range || ""}
                  onChange={(e) => handleConfigChange("range", e.target.value)}
                />
              </div>
              {sheetNames.length > 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  ✨ Automatically fetched {sheetNames.length} sheets from your spreadsheet.
                </p>
              )}
            </div>
          </>
        );
      case "google-calendar":
        const normalizedCalAction = (config.action || "list-events").replace(/-/g, '_');
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={normalizedCalAction}
                onValueChange={(value) => handleConfigChange("action", value.replace(/_/g, '-'))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list_events">List Events</SelectItem>
                  <SelectItem value="create_event">Create Event</SelectItem>
                  <SelectItem value="get_event">Get Event Details</SelectItem>
                  <SelectItem value="update_event">Update Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="calendarId">Calendar Select</Label>
                {isFetchingCalendars && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
              </div>
              <Input
                id="calendarId"
                placeholder="primary or calendar ID"
                value={config.calendarId || ""}
                onChange={(e) => handleConfigChange("calendarId", e.target.value)}
              />

              {/* Calendar Browser */}
              <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Your Calendars
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 thin-scrollbar">
                  {recentCalendars.length > 0 ? (
                    recentCalendars.map((cal) => (
                      <button
                        key={cal.id}
                        onClick={() => handleConfigChange("calendarId", cal.id)}
                        className={`w-full text-left p-2 rounded-md transition-all flex items-center gap-2 group ${config.calendarId === cal.id
                          ? 'bg-primary/10 border-primary/20 border shadow-sm'
                          : 'hover:bg-background border border-transparent'
                          }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cal.backgroundColor || '#4285f4' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate group-hover:text-primary transition-colors">
                            {cal.summary}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate uppercase">
                            {cal.role}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : !isFetchingCalendars ? (
                    <p className="text-[10px] text-muted-foreground italic p-2">No calendars found.</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Event Browser */}
            {(normalizedCalAction === "get_event" || normalizedCalAction === "update_event" || normalizedCalAction === "list_events") && config.calendarId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Upcoming Events
                  </Label>
                  {isFetchingEvents && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                </div>
                <div className="p-3 bg-muted/20 rounded-lg border border-border/40 space-y-1.5 max-h-[160px] overflow-y-auto thin-scrollbar">
                  {recentEvents.length > 0 ? (
                    recentEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          handleConfigChange("eventId", event.id);
                          if (normalizedCalAction === "update_event") {
                            handleConfigChange("eventTitle", event.summary || "");
                            handleConfigChange("description", event.description || "");
                            if (event.start?.dateTime) {
                              handleConfigChange("startDate", event.start.dateTime.slice(0, 16));
                            }
                            if (event.end?.dateTime) {
                              handleConfigChange("endDate", event.end.dateTime.slice(0, 16));
                            }
                          }
                        }}
                        className={`w-full text-left p-2 rounded-md transition-all flex flex-col gap-0.5 group ${config.eventId === event.id
                          ? 'bg-primary/10 border-primary/20 border shadow-sm'
                          : 'hover:bg-background border border-transparent'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <p className="text-[11px] font-medium truncate group-hover:text-primary transition-colors">
                            {event.summary || '(No Title)'}
                          </p>
                          <span className="text-[9px] text-muted-foreground">
                            {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'All Day'}
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">
                          {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Time'}
                        </p>
                      </button>
                    ))
                  ) : !isFetchingEvents ? (
                    <p className="text-[10px] text-muted-foreground italic p-1">No upcoming events found.</p>
                  ) : (
                    <div className="flex items-center justify-center p-4">
                      <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {(normalizedCalAction === "create_event" || normalizedCalAction === "update_event") && (
              <div className="space-y-2">
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  placeholder="Class Meeting"
                  value={config.eventTitle || ""}
                  onChange={(e) => handleConfigChange("eventTitle", e.target.value)}
                />
              </div>
            )}

            {(normalizedCalAction === "get_event" || normalizedCalAction === "update_event") && (
              <div className="space-y-2">
                <Label htmlFor="eventId">Event ID</Label>
                <Input
                  id="eventId"
                  placeholder="Enter event ID..."
                  value={config.eventId || ""}
                  onChange={(e) => handleConfigChange("eventId", e.target.value)}
                />
              </div>
            )}

            {(normalizedCalAction === "create_event" || normalizedCalAction === "update_event") && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date/Time</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={config.startDate || ""}
                      onChange={(e) => handleConfigChange("startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date/Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={config.endDate || ""}
                      onChange={(e) => handleConfigChange("endDate", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description / Agenda</Label>
                  <Textarea
                    id="description"
                    placeholder="Meeting details..."
                    value={config.description || ""}
                    onChange={(e) => handleConfigChange("description", e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )
            }
          </div>
        );
      case "google-meet":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Class Session"
                value={config.title || ""}
                onChange={(e) => handleConfigChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={config.duration || 60}
                onChange={(e) => handleConfigChange("duration", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (comma-separated)</Label>
              <Textarea
                id="attendees"
                placeholder="student1@school.edu, student2@school.edu"
                value={config.attendees || ""}
                onChange={(e) => handleConfigChange("attendees", e.target.value)}
                rows={2}
              />
            </div>
          </>
        );
      case "google-forms":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={config.action || "get_responses"}
                onValueChange={(value) => handleConfigChange("action", value.replace(/-/g, '_'))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="get_responses">Fetch Form Responses</SelectItem>
                  <SelectItem value="get_form">Get Form Details</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="formId">Google Form</Label>
              <div className="flex gap-2">
                <Input
                  id="formId"
                  placeholder="Paste Form ID or URL..."
                  value={config.formId || ""}
                  onChange={(e) => handleConfigChange("formId", e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchRecentForms}
                  disabled={isFetchingForms}
                  title="Reload Forms"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingForms ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="mt-4 p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> FORM BROWSER
                  </h4>
                </div>

                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 thin-scrollbar">
                  {recentForms.length > 0 ? (
                    recentForms.map((form) => (
                      <div
                        key={form.id}
                        className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${config.formId === form.id
                          ? 'bg-white dark:bg-slate-800 border-primary shadow-sm ring-1 ring-primary/20'
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-sm'
                          }`}
                        onClick={() => {
                          handleConfigChange("formId", form.id);
                          handleConfigChange("formName", form.name);
                        }}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                            {form.name}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-medium tracking-tight">
                            {new Date(form.modifiedTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <a
                          href={form.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-primary transition-all px-2 py-1 rounded-lg hover:bg-primary/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      </div>
                    ))
                  ) : !isFetchingForms ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <FormInput className="w-6 h-6 text-slate-300 mb-2" />
                      <p className="text-[10px] text-slate-500 font-medium">No forms available</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-2 rounded italic border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Tip: Use manual Form ID if your form doesn't appear in the list.
            </p>

            {/* Visual Log Data */}
            {config.formId && (
              <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-blue-500" />
                    Visual Log Data
                  </h4>
                  <Badge variant="outline" className="text-[9px] font-bold bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 border-blue-200/50 dark:border-blue-800/50 px-2 py-0">
                    {recentResponses.length} Responses
                  </Badge>
                </div>

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 thin-scrollbar">
                  {isFetchingResponses ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <RefreshCw className="w-6 h-6 animate-spin text-primary/30 mb-2" />
                      <p className="text-[10px] text-slate-500 font-medium">Tracking live data...</p>
                    </div>
                  ) : recentResponses.length > 0 ? (
                    <div className="relative pl-4 space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800/50 after:absolute after:left-[4px] after:top-2 after:bottom-2 after:w-[8px] after:bg-transparent after:pointer-events-none">
                      {recentResponses.slice(0, 5).map((response, idx) => (
                        <div key={response.responseId || idx} className="relative">
                          <div className="absolute -left-[14px] top-1.5 w-[14px] h-[14px] rounded-full bg-white dark:bg-slate-950 border-2 border-primary/40 z-10 box-content shadow-sm" />
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                Response Logged
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(response.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:border-primary/20">
                              <div className="grid grid-cols-1 gap-1.5">
                                {Object.entries(response.answers || {}).slice(0, 2).map(([qId, ans]: [any, any]) => (
                                  <div key={qId} className="flex flex-col gap-0.5">
                                    <span className="text-[8px] font-bold text-slate-400 truncate tracking-tight uppercase">
                                      {formQuestions[qId] || "FIELD"}
                                    </span>
                                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate pl-1.5 border-l-2 border-slate-100 dark:border-slate-800">
                                      {ans.textAnswers?.answers?.[0]?.value || "No response"}
                                    </p>
                                  </div>
                                ))}
                                {Object.keys(response.answers || {}).length > 2 && (
                                  <p className="text-[8px] text-primary/60 font-medium italic pt-1 border-t border-slate-50 dark:border-slate-800 mt-1">
                                    + {Object.keys(response.answers || {}).length - 2} more fields captured
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[9px] uppercase tracking-widest font-bold text-slate-400 hover:text-primary hover:bg-primary/5"
                          onClick={() => fetchRecentResponses(config.formId)}
                        >
                          <RefreshCw className={`w-3 h-3 mr-2 ${isFetchingResponses ? 'animate-spin' : ''}`} />
                          Sync Latest
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <div className="p-3 bg-white dark:bg-slate-950 rounded-full mb-3 shadow-inner">
                        <Activity className="w-5 h-5 text-slate-300" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium max-w-[150px] text-center">No recent activity tracked.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      // Microsoft
      case "microsoft-teams":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="teamId">Team ID</Label>
              <Input
                id="teamId"
                placeholder="team-123"
                value={config.teamId || ""}
                onChange={(e) => handleConfigChange("teamId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID</Label>
              <Input
                id="channelId"
                placeholder="channel-123"
                value={config.channelId || ""}
                onChange={(e) => handleConfigChange("channelId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "microsoft-outlook":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={config.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email Subject"
                value={config.subject || ""}
                onChange={(e) => handleConfigChange("subject", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                placeholder="Email content..."
                value={config.body || ""}
                onChange={(e) => handleConfigChange("body", e.target.value)}
                rows={4}
              />
            </div>
          </>
        );
      case "microsoft-onedrive":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={config.action || "list"}
                onValueChange={(value) => handleConfigChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List Files</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="folderId">Folder ID</Label>
              <Input
                id="folderId"
                placeholder="root"
                value={config.folderId || ""}
                onChange={(e) => handleConfigChange("folderId", e.target.value)}
              />
            </div>
          </>
        );
      case "microsoft-excel":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="workbookId">Workbook ID</Label>
              <Input
                id="workbookId"
                placeholder="workbook-123"
                value={config.workbookId || ""}
                onChange={(e) => handleConfigChange("workbookId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheetName">Sheet Name</Label>
              <Input
                id="sheetName"
                placeholder="Sheet1"
                value={config.sheetName || ""}
                onChange={(e) => handleConfigChange("sheetName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range">Range</Label>
              <Input
                id="range"
                placeholder="A1:Z100"
                value={config.range || ""}
                onChange={(e) => handleConfigChange("range", e.target.value)}
              />
            </div>
          </>
        );

      // Communication extras
      case "slack-send":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Input
                id="channel"
                placeholder="#general"
                value={config.channel || ""}
                onChange={(e) => handleConfigChange("channel", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "discord-send":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">Webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://discord.com/api/webhooks/..."
                value={config.webhookUrl || ""}
                onChange={(e) => handleConfigChange("webhookUrl", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "telegram-send":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="123456789"
                value={config.chatId || ""}
                onChange={(e) => handleConfigChange("chatId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );

      // Zoom
      case "zoom-meeting":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="topic">Meeting Topic</Label>
              <Input
                id="topic"
                placeholder="Class Session"
                value={config.topic || ""}
                onChange={(e) => handleConfigChange("topic", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={config.duration || 60}
                onChange={(e) => handleConfigChange("duration", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password (optional)</Label>
              <Input
                id="password"
                placeholder="meeting-password"
                value={config.password || ""}
                onChange={(e) => handleConfigChange("password", e.target.value)}
              />
            </div>
          </>
        );
      case "zoom-recording":
        return (
          <div className="space-y-2">
            <Label htmlFor="meetingId">Meeting ID</Label>
            <Input
              id="meetingId"
              placeholder="123456789"
              value={config.meetingId || ""}
              onChange={(e) => handleConfigChange("meetingId", e.target.value)}
            />
          </div>
        );

      // Education extras
      case "grade-calculate":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="formula">Calculation Formula</Label>
              <Select
                value={config.formula || "average"}
                onValueChange={(value) => handleConfigChange("formula", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="weighted">Weighted Average</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="highest">Highest Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "student-notify":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="recipientType">Recipients</Label>
              <Select
                value={config.recipientType || "all"}
                onValueChange={(value) => handleConfigChange("recipientType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="class">Specific Class</SelectItem>
                  <SelectItem value="selected">Selected Students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message..."
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "quiz-create":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                placeholder="Chapter 5 Quiz"
                value={config.title || ""}
                onChange={(e) => handleConfigChange("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                placeholder="30"
                value={config.timeLimit || 30}
                onChange={(e) => handleConfigChange("timeLimit", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attempts">Max Attempts</Label>
              <Input
                id="attempts"
                type="number"
                placeholder="1"
                value={config.attempts || 1}
                onChange={(e) => handleConfigChange("attempts", parseInt(e.target.value))}
              />
            </div>
          </>
        );
      case "report-generate":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select
                value={config.reportType || "progress"}
                onValueChange={(value) => handleConfigChange("reportType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="progress">Progress Report</SelectItem>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="grades">Grade Report</SelectItem>
                  <SelectItem value="performance">Performance Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={config.format || "pdf"}
                onValueChange={(value) => handleConfigChange("format", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      // AI & Analytics
      case "ai-summarize":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="maxLength">Max Length (words)</Label>
              <Input
                id="maxLength"
                type="number"
                placeholder="200"
                value={config.maxLength || 200}
                onChange={(e) => handleConfigChange("maxLength", parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select
                value={config.style || "bullet-points"}
                onValueChange={(value) => handleConfigChange("style", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullet-points">Bullet Points</SelectItem>
                  <SelectItem value="paragraph">Paragraph</SelectItem>
                  <SelectItem value="key-points">Key Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "ai-translate":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="sourceLang">Source Language</Label>
              <Select
                value={config.sourceLang || "auto"}
                onValueChange={(value) => handleConfigChange("sourceLang", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLang">Target Language</Label>
              <Select
                value={config.targetLang || "en"}
                onValueChange={(value) => handleConfigChange("targetLang", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "ai-sentiment":
        return (
          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <p className="text-sm text-muted-foreground">Analyzes text for positive, negative, or neutral sentiment</p>
          </div>
        );
      case "analytics-track":
        return (
          <div className="space-y-2">
            <Label htmlFor="event">Event Name</Label>
            <Input
              id="event"
              placeholder="workflow_completed"
              value={config.event || ""}
              onChange={(e) => handleConfigChange("event", e.target.value)}
            />
          </div>
        );
      case "chart-generate":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="chartType">Chart Type</Label>
              <Select
                value={config.chartType || "bar"}
                onValueChange={(value) => handleConfigChange("chartType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Chart Title</Label>
              <Input
                id="title"
                placeholder="Student Performance"
                value={config.title || ""}
                onChange={(e) => handleConfigChange("title", e.target.value)}
              />
            </div>
          </>
        );

      // Data & Storage
      case "database-query":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="query">SQL Query</Label>
              <Textarea
                id="query"
                placeholder="SELECT * FROM students WHERE..."
                value={config.query || ""}
                onChange={(e) => handleConfigChange("query", e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                placeholder="default"
                value={config.database || ""}
                onChange={(e) => handleConfigChange("database", e.target.value)}
              />
            </div>
          </>
        );
      case "spreadsheet-update":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
              <Input
                id="spreadsheetId"
                placeholder="spreadsheet-123"
                value={config.spreadsheetId || ""}
                onChange={(e) => handleConfigChange("spreadsheetId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="range">Cell Range</Label>
              <Input
                id="range"
                placeholder="A1"
                value={config.range || ""}
                onChange={(e) => handleConfigChange("range", e.target.value)}
              />
            </div>
          </>
        );
      case "file-read":
        return (
          <div className="space-y-2">
            <Label htmlFor="path">File Path</Label>
            <Input
              id="path"
              placeholder="/data/students.json"
              value={config.path || ""}
              onChange={(e) => handleConfigChange("path", e.target.value)}
            />
          </div>
        );
      case "file-write":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="path">File Path</Label>
              <Input
                id="path"
                placeholder="/output/report.txt"
                value={config.path || ""}
                onChange={(e) => handleConfigChange("path", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="File content..."
                value={config.content || ""}
                onChange={(e) => handleConfigChange("content", e.target.value)}
                rows={3}
              />
            </div>
          </>
        );
      case "json-parse":
        return (
          <div className="space-y-2">
            <Label htmlFor="inputPath">Input Field Path</Label>
            <Input
              id="inputPath"
              placeholder="data.response"
              value={config.inputPath || ""}
              onChange={(e) => handleConfigChange("inputPath", e.target.value)}
            />
          </div>
        );

      // Logic extras
      case "loop":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="items">Items Array Path</Label>
              <Input
                id="items"
                placeholder="data.students"
                value={config.items || ""}
                onChange={(e) => handleConfigChange("items", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxIterations">Max Iterations</Label>
              <Input
                id="maxIterations"
                type="number"
                placeholder="100"
                value={config.maxIterations || 100}
                onChange={(e) => handleConfigChange("maxIterations", parseInt(e.target.value))}
              />
            </div>
          </>
        );
      case "filter":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Input
                id="field"
                placeholder="status"
                value={config.field || ""}
                onChange={(e) => handleConfigChange("field", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operator">Operator</Label>
              <Select
                value={config.operator || "equals"}
                onValueChange={(value) => handleConfigChange("operator", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not-equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="not-contains">Not Contains</SelectItem>
                  <SelectItem value="greater-than">Greater Than</SelectItem>
                  <SelectItem value="less-than">Less Than</SelectItem>
                  <SelectItem value="exists">Exists</SelectItem>
                  <SelectItem value="not-exists">Not Exists</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                placeholder="active"
                value={config.value || ""}
                onChange={(e) => handleConfigChange("value", e.target.value)}
              />
            </div>
          </>
        );
      case "split":
        return (
          <div className="space-y-2">
            <Label htmlFor="branches">Number of Branches</Label>
            <Input
              id="branches"
              type="number"
              placeholder="2"
              value={config.branches || 2}
              onChange={(e) => handleConfigChange("branches", parseInt(e.target.value))}
            />
          </div>
        );
      case "merge":
        return (
          <div className="space-y-2">
            <Label htmlFor="mode">Merge Mode</Label>
            <Select
              value={config.mode || "wait-all"}
              onValueChange={(value) => handleConfigChange("mode", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wait-all">Wait for All</SelectItem>
                <SelectItem value="first">First Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      case "transform":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="expression">Transform Expression</Label>
              <Textarea
                id="expression"
                placeholder="data.map(item => item.name)"
                value={config.expression || ""}
                onChange={(e) => handleConfigChange("expression", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputField">Output Field</Label>
              <Input
                id="outputField"
                placeholder="result"
                value={config.outputField || ""}
                onChange={(e) => handleConfigChange("outputField", e.target.value)}
              />
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-gray-500 italic">
            No configuration available for this node type.
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
        <div>
          <h3 className="font-semibold text-foreground">{node.data.label}</h3>
          <p className="text-xs text-muted-foreground">{node.data.nodeType}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {renderConfigFields()}
      </div>

      <div className="p-4 border-t border-border bg-muted/10">
        <Button
          variant="destructive"
          className="w-full"
          onClick={onDelete}
        >
          Delete Node
        </Button>
      </div>
    </div>
  );
}