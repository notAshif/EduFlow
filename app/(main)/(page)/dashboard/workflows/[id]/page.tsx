/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Play,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowRun {
  id: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
}

interface Workflow {
  id: string;
  name: string;
  enabled: boolean;
  nodes: any[];
  edges: any[];
  createdAt: string;
  updatedAt: string;
  runs: WorkflowRun[];
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;
  const { toast } = useToast();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchWorkflow();
  }, [workflowId]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${workflowId}`);
      const data = await response.json();

      if (data.ok) {
        setWorkflow(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch workflow');
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workflow details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    try {
      setExecuting(true);
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: 'Workflow Started',
          description: 'Workflow execution has been triggered',
        });
        
        // Navigate to the run detail page
        router.push(`/dashboard/workflows/${workflowId}/runs/${data.data.runId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute workflow',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${workflow?.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: 'Workflow Deleted',
          description: 'Workflow has been deleted successfully',
        });
        router.push('/dashboard/workflows');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete workflow',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'RUNNING':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      SUCCESS: 'default' as const,
      FAILED: 'destructive' as const,
      RUNNING: 'secondary' as const,
      PENDING: 'secondary' as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/workflows">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">Workflow not found</p>
            <Link href="/dashboard/workflows">
              <Button>Back to Workflows</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/workflows">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={workflow.enabled ? 'default' : 'secondary'}>
                {workflow.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-gray-600">
                {workflow.nodes.length} nodes • {workflow.runs.length} runs
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExecute} disabled={executing || !workflow.enabled}>
            <Play className="w-4 h-4 mr-2" />
            {executing ? 'Running...' : 'Run'}
          </Button>
          <Link href={`/dashboard/workflows/${workflowId}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Workflow Info */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Created</div>
              <div className="text-sm">
                {new Date(workflow.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Last Updated</div>
              <div className="text-sm">
                {new Date(workflow.updatedAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Runs</div>
              <div className="text-sm">{workflow.runs.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>
        <CardContent>
          {workflow.runs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No runs yet. Click &quot;Run&quot; to execute this workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {workflow.runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/dashboard/workflows/${workflowId}/runs/${run.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(run.status)}
                      <div>
                        <p className="font-medium text-sm">Run {run.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.startedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(run.status)}
                      {run.finishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(
                            (new Date(run.finishedAt).getTime() -
                              new Date(run.startedAt).getTime()) /
                              1000
                          )}
                          s
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}