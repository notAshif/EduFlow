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
  Play
} from 'lucide-react';

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
const ReadOnlyNode = ({ data }: { data: any }) => {
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

  const statusColor = data.executionStatus === 'SUCCESS'
    ? 'border-green-500 ring-2 ring-green-500/20'
    : data.executionStatus === 'FAILED'
      ? 'border-red-500 ring-2 ring-red-500/20'
      : 'border-border';

  return (
    <div className={`relative min-w-[240px] rounded-xl bg-card border-2 transition-all duration-200 shadow-sm ${statusColor}`}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
      <div className="flex items-center p-3 gap-3">
        <div className={`p-2.5 rounded-lg shadow-sm ${getNodeColor(data.nodeType)}`}>
          {getNodeIcon(data.nodeType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate text-card-foreground">{data.label}</div>
          <div className="text-xs text-muted-foreground truncate">{data.nodeType}</div>
        </div>
        {data.executionStatus === 'SUCCESS' && <CheckCircle className="w-5 h-5 text-green-500" />}
        {data.executionStatus === 'FAILED' && <XCircle className="w-5 h-5 text-red-500" />}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background" />
    </div>
  );
};

const nodeTypes = { custom: ReadOnlyNode };

export default function WorkflowRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const runId = params.runId as string;

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

        <TabsContent value="trace" className="flex-1 m-0 relative bg-muted/5 border rounded-lg overflow-hidden">
          <ReactFlow
            nodes={processedNodes}
            edges={workflow.edges}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
          >
            <Background color="#94a3b8" gap={16} size={1} />
            <Controls />
            <MiniMap />
          </ReactFlow>
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