/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Mail,
  Phone,
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
  Play,
  Layers,
  Sparkles,
  Send,
  GraduationCap,
  FolderOpen,
  Sheet,
  Video,
  FormInput,
  Presentation
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type NodeStatus = 'idle' | 'running' | 'success' | 'error' | 'warning' | 'missing-integration';

interface NodeLog {
  nodeId: string;
  success: boolean;
  output?: any;
  error?: string;
  durationMs?: number;
}

interface WorkflowRun {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  logs: NodeLog[];
}

interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

// Reuse CustomNode for visual consistency (simplified for read-only)
const ReadOnlyNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const status: NodeStatus = data.executionStatus === 'SUCCESS' ? 'success' : data.executionStatus === 'FAILED' ? 'error' : 'idle';

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
      // Google Suite
      "google-classroom": GraduationCap,
      "google-drive": FolderOpen,
      "google-sheets": Sheet,
      "google-calendar": Calendar,
      "google-meet": Video,
      "google-forms": FormInput,
      "google-slides": Presentation,
      // Logic & Utility
      delay: Clock,
      condition: GitBranch,
      "file-upload": Upload,
      "local-ai": Brain,
      "http-request": Globe,
    };
    const Icon = iconMap[type] || MessageSquare;
    return <Icon className="w-5 h-5 text-primary-foreground" />;
  };

  const getNodeColor = (type: string) => {
    if (type === 'google-sheets') return 'bg-gradient-to-br from-green-500 to-emerald-600';
    if (type === 'google-calendar') return 'bg-gradient-to-br from-blue-500 to-indigo-600';
    if (type === 'google-drive') return 'bg-gradient-to-br from-yellow-400 to-orange-500';
    if (type === 'google-forms') return 'bg-gradient-to-br from-purple-500 to-violet-600';
    if (type.startsWith('google-')) return 'bg-gradient-to-br from-blue-500 via-green-500 to-yellow-500';
    if (type.includes('send') || type.includes('alert')) return 'bg-gradient-to-br from-sky-500 to-blue-700';
    if (type.includes('track') || type.includes('create') || type.includes('check')) return 'bg-gradient-to-br from-emerald-500 to-green-700';
    if (type === 'condition') return 'bg-gradient-to-br from-orange-400 to-red-500';
    if (type === 'delay') return 'bg-gradient-to-br from-amber-400 to-yellow-600';
    if (type === 'local-ai') return 'bg-gradient-to-br from-violet-600 to-indigo-700';
    return 'bg-primary';
  };

  const getBorderClass = () => {
    if (selected) return 'border-primary ring-4 ring-primary/10';
    switch (status) {
      case 'success': return 'border-green-500 ring-2 ring-green-500/20';
      case 'error': return 'border-red-500 ring-2 ring-red-500/20';
      default: return 'border-border hover:border-muted-foreground/50';
    }
  };

  const getResourceInfo = () => {
    if (!data.config) return null;
    const info = data.config.formName || data.config.spreadsheetName || data.config.sheetName || data.config.calendarName;
    if (!info) return null;
    return (
      <div className="mt-1 px-2 py-0.5 rounded bg-muted/50 text-[9px] font-medium text-muted-foreground uppercase tracking-tight truncate border border-border/30 inline-block max-w-[140px]">
        {info}
      </div>
    );
  };

  return (
    <div
      className={`relative min-w-[260px] rounded-2xl bg-card border-[1.5px] transition-all duration-300 shadow-sm ${getBorderClass()}`}
    >
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-background !border-2 !border-muted-foreground/30 !-left-2" />
      <div className="flex items-center p-3.5 gap-4">
        <div className={`p-3 rounded-xl shadow-lg ${getNodeColor(data.nodeType)}`}>
          {getNodeIcon(data.nodeType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate text-card-foreground tracking-tight">
            {data.label}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5">
            {data.nodeType.replace(/-/g, ' ')}
          </div>
          {getResourceInfo()}
        </div>
        {status === 'success' && <div className="p-1 rounded-full bg-green-500/10 text-green-500"><CheckCircle2 className="w-5 h-5" /></div>}
        {status === 'error' && <div className="p-1 rounded-full bg-red-500/10 text-red-500"><XCircle className="w-5 h-5" /></div>}
      </div>
      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-background !border-2 !border-muted-foreground/30 !-right-2" />
    </div>
  );
};

const nodeTypes = { custom: ReadOnlyNode };

export default function WorkflowRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const runId = params.runId as string;
  const { toast } = useToast();

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedLog = useMemo(() => {
    if (!run || !selectedNodeId) return null;
    return run.logs.find(l => l.nodeId === selectedNodeId) || null;
  }, [run, selectedNodeId]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const [runRes, workflowRes] = await Promise.all([
          fetch(`/api/workflows/${workflowId}/runs/${runId}`),
          fetch(`/api/workflows/${workflowId}`)
        ]);

        const runData = await runRes.json();
        const workflowData = await workflowRes.json();

        if (runData.ok) {
          setRun(runData.data);
          // If running, keep polling
          if (runData.data.status === 'RUNNING' || runData.data.status === 'PENDING') {
            intervalId = setTimeout(fetchData, 2000);
          }
        }
        if (workflowData.ok) setWorkflow(workflowData.data);
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [workflowId, runId]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) newSet.delete(nodeId);
      else newSet.add(nodeId);
      return newSet;
    });
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNodeId(node.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'RUNNING': return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      SUCCESS: 'default' as const,
      FAILED: 'destructive' as const,
      RUNNING: 'secondary' as const,
      PENDING: 'secondary' as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Process nodes to include execution status
  const processedNodes = useMemo(() => {
    if (!workflow || !run) return [];

    const logMap = new Map(run.logs.map(log => [log.nodeId, log]));

    return workflow.nodes.map(node => ({
      ...node,
      draggable: false,
      selectable: true,
      data: {
        ...node.data,
        executionStatus: logMap.get(node.id)?.success ? 'SUCCESS' : logMap.get(node.id) ? 'FAILED' : 'PENDING',
        executionData: logMap.get(node.id)
      }
    }));
  }, [workflow, run]);

  if (loading && !run) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!run || !workflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/workflows/${workflowId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workflow
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Details Not Found</h3>
            <p className="text-gray-600 mb-4">The run details could not be loaded.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const duration = run.finishedAt
    ? new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/workflows/${workflowId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Run #{run.id.slice(0, 8)}
              {getStatusBadge(run.status)}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(run.startedAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" /> {formatDuration(duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="trace" className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b border-border">
          <TabsList>
            <TabsTrigger value="trace">Visual Trace</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="trace" className="flex-1 m-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 relative bg-muted/5 border rounded-2xl overflow-hidden shadow-inner">
            <ReactFlow
              nodes={processedNodes.map(n => ({
                ...n,
                selected: n.id === selectedNodeId
              }))}
              edges={workflow.edges}
              nodeTypes={nodeTypes}
              onNodeClick={onNodeClick}
              fitView
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
            >
              <Background color="#94a3b8" gap={16} size={1} />
              <Controls className="bg-background border-border" />
              <MiniMap />
            </ReactFlow>
          </div>

          {/* Node Execution Details Panel */}
          {selectedNodeId && (
            <div className="h-1/3 bg-background border rounded-2xl p-6 overflow-y-auto animate-in slide-in-from-bottom-4 duration-500 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {selectedLog?.success ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    Node Execution Result
                  </h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">ID: {selectedNodeId}</p>
                </div>
                {selectedLog?.durationMs && (
                  <Badge variant="outline" className="px-3 py-1 font-mono">{formatDuration(selectedLog.durationMs)}</Badge>
                )}
              </div>

              {!selectedLog ? (
                <div className="flex flex-col items-center justify-center p-12 bg-muted/5 rounded-xl border border-dashed text-center">
                  <Clock className="w-10 h-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">This node hasn't executed yet or is waiting in the queue.</p>
                </div>
              ) : selectedLog.error ? (
                <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-200 dark:border-red-900/50">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold mb-2">
                    <AlertCircle className="w-5 h-5" />
                    Execution Failed
                  </div>
                  <pre className="text-xs whitespace-pre-wrap font-mono text-red-800 dark:text-red-300 bg-red-100/50 dark:bg-red-900/30 p-4 rounded-xl">
                    {selectedLog.error}
                  </pre>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Rich Display for Google Forms */}
                  {selectedLog.output?.nodeType === 'google-forms' && selectedLog.output?.output?.responses && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-[10px] font-bold text-primary/60 uppercase mb-1">Total Hits</p>
                          <p className="text-2xl font-black">{selectedLog.output.output.totalResponses}</p>
                        </div>
                        <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                          <p className="text-[10px] font-bold text-purple-500/60 uppercase mb-1">Action</p>
                          <p className="text-sm font-bold capitalize">{selectedLog.output.output.action.replace(/_/g, ' ')}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          LIVE DATA CAPTURED
                        </h4>
                        <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 thin-scrollbar">
                          {selectedLog.output.output.responses.map((resp: any, i: number) => (
                            <div key={i} className="p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold bg-muted px-2 py-1 rounded-lg uppercase tracking-wider">Response #{i + 1}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">{new Date(resp.createTime).toLocaleString()}</span>
                              </div>
                              <div className="space-y-3">
                                {Object.entries(resp.answers || {}).map(([qId, ans]: [any, any]) => (
                                  <div key={qId} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{qId}</span>
                                    <p className="text-xs font-medium pl-3 border-l-2 border-primary/20 bg-primary/5 py-2 px-3 rounded-r-lg">
                                      {ans.textAnswers?.answers?.[0]?.value || "N/A"}
                                    </p>
                                  </div>
                                ))}
                                {resp.respondentEmail && (
                                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
                                    <Mail className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground font-bold">{resp.respondentEmail}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Standard JSON View */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1">Raw Output (JSON)</h4>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 hover:bg-muted" onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selectedLog.output, null, 2));
                        toast({ title: "Copied!", description: "Log data copied to clipboard" });
                      }}>
                        Copy JSON
                      </Button>
                    </div>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono p-5 bg-slate-950 text-slate-200 rounded-2xl shadow-2xl thin-scrollbar border border-slate-800">
                      {JSON.stringify(selectedLog.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="flex-1 m-0 overflow-y-auto">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {run.logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No execution logs available</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {run.logs.map((log, index) => (
                    <div key={`${log.nodeId}-${index}`} className="p-4 hover:bg-muted/50 transition-colors">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleNodeExpansion(log.nodeId)}
                      >
                        <div className="flex items-center space-x-3">
                          {expandedNodes.has(log.nodeId) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          {log.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          <div>
                            <div className="font-medium text-sm">Node: {log.nodeId}</div>
                            {log.durationMs !== undefined && (
                              <div className="text-xs text-muted-foreground">{formatDuration(log.durationMs)}</div>
                            )}
                          </div>
                        </div>
                        <Badge variant={log.success ? 'outline' : 'destructive'}>{log.success ? 'Success' : 'Failed'}</Badge>
                      </div>

                      {expandedNodes.has(log.nodeId) && (
                        <div className="mt-3 pl-8 space-y-3">
                          {log.error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                              <span className="font-semibold">Error:</span> {log.error}
                            </div>
                          )}
                          {log.output && (
                            <div className="bg-muted p-3 rounded border border-border">
                              <div className="text-xs font-semibold text-muted-foreground mb-1">Output</div>
                              <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                                {JSON.stringify(log.output, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}