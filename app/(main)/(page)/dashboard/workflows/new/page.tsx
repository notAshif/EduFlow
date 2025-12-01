/* eslint-disable @typescript-eslint/no-explicit-any */
// app/dashboard/workflows/new/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
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
  Layers
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

const CustomNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const getNodeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      "twilio-sms": Phone,
      "twilio-whatsapp": Phone,
      "email-send": Mail,
      delay: Clock,
      condition: GitBranch,
      "file-upload": Upload,
      "local-ai": Brain,
      "http-request": Globe,
      "slack-send": Slack,
      "discord-send": MessageCircle,
      "whatsapp-group": Users,
      "alert-send": Bell,
      "attendance-track": ClipboardCheck,
      "assignment-create": FileText,
      "schedule-check": Calendar,
    };

    const Icon = iconMap[type] || MessageSquare;
    return <Icon className="w-5 h-5 text-primary-foreground" />;
  };

  const getNodeColor = (type: string) => {
    if (type.includes('send') || type.includes('alert')) return 'bg-blue-500';
    if (type.includes('check') || type.includes('track')) return 'bg-green-500';
    if (type === 'condition') return 'bg-orange-500';
    if (type === 'delay') return 'bg-yellow-500';
    if (type === 'local-ai') return 'bg-purple-500';
    return 'bg-primary';
  };

  return (
    <div
      className={`relative group min-w-[240px] rounded-xl bg-card border-2 transition-all duration-200 shadow-sm hover:shadow-md ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
        }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-colors group-hover:!bg-primary"
      />

      <div className="flex items-center p-3 gap-3">
        {/* Icon Box */}
        <div className={`p-2.5 rounded-lg shadow-sm ${getNodeColor(data.nodeType)}`}>
          {getNodeIcon(data.nodeType)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-card-foreground">
            {data.label}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {data.nodeType.replace(/-/g, ' ')}
          </div>
        </div>

        {/* Status Indicator (if needed) */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="w-2 h-2 rounded-full bg-green-500" title="Configured" />
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background transition-colors group-hover:!bg-primary"
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const nodePalette = [
  {
    category: "Communication",
    items: [
      { type: "whatsapp-group", label: "WhatsApp Group", icon: Users, description: "Send to group" },
      { type: "alert-send", label: "Multi-Channel Alert", icon: Bell, description: "WhatsApp, Email, SMS" },
      { type: "twilio-sms", label: "Send SMS", icon: Phone, description: "Via Twilio" },
      { type: "email-send", label: "Send Email", icon: Mail, description: "Via SMTP" },
    ]
  },
  {
    category: "Education",
    items: [
      { type: "attendance-track", label: "Track Attendance", icon: ClipboardCheck, description: "Monitor attendance" },
      { type: "assignment-create", label: "Create Assignment", icon: FileText, description: "Distribute tasks" },
      { type: "schedule-check", label: "Check Schedule", icon: Calendar, description: "Class reminders" },
    ]
  },
  {
    category: "Logic & Utility",
    items: [
      { type: "delay", label: "Delay", icon: Clock, description: "Wait for duration" },
      { type: "condition", label: "Condition", icon: GitBranch, description: "If/Else logic" },
      { type: "local-ai", label: "AI Analysis", icon: Brain, description: "Analyze content" },
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
        case "whatsapp-group":
          return { to: "+1234567890", message: "Hello from FlowX!", groupName: "Test Group" };
        case "alert-send":
          return {
            channels: ["whatsapp", "email"],
            title: "Alert",
            recipients: "test@example.com",
            message: "Something happened!",
            priority: "normal"
          };
        case "attendance-track":
          return { threshold: 75, action: "alert" };
        case "assignment-create":
          return { title: "New Assignment", description: "Please complete by Friday", dueDate: new Date().toISOString().split('T')[0] };
        case "schedule-check":
          return { reminderMinutes: 15 };
        case "twilio-sms":
          return { to: "+1234567890", message: "Hello!" };
        case "email-send":
          return { to: "test@example.com", subject: "Test", body: "Hello!" };
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
    <div className="h-screen flex flex-col bg-background">
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
        <div className="w-96 bg-background border-l border-border flex flex-col shadow-xl z-20">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-4 pb-2 border-b border-border">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="palette" className="gap-2">
                  <Plus className="w-4 h-4" /> Add Node
                </TabsTrigger>
                <TabsTrigger value="properties" disabled={!selectedNode} className="gap-2">
                  <Settings2 className="w-4 h-4" /> Properties
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1">
              <TabsContent value="palette" className="p-4 m-0 space-y-6">
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
              </TabsContent>

              <TabsContent value="properties" className="p-0 m-0 h-full">
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
            </ScrollArea>
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
      return newConfig;
    });
  };

  const renderConfigFields = () => {
    switch (node.data.nodeType) {
      case "whatsapp-group":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">Recipients (comma-separated)</Label>
              <Textarea
                id="to"
                placeholder="+919876543210, +919876543211"
                value={config.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                placeholder="Parent Group"
                value={config.groupName || ""}
                onChange={(e) => handleConfigChange("groupName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter message"
                value={config.message || ""}
                onChange={(e) => handleConfigChange("message", e.target.value)}
                rows={3}
              />
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
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
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