/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/db';
import { WorkflowNode, NodeResult, NodeExecutionContext } from '@/lib/types';
import { createNodeInstance } from './nodes';
import { emitDashboardEvent, emitNotification } from '@/lib/realtime';
import { checkWorkflowIntegrations, getMissingIntegrationsSummary } from './integration-check';

function isWorkflowNodeArray(v: any): v is WorkflowNode[] {
  return Array.isArray(v) && v.every(item =>
    item && typeof item.id === 'string' && typeof item.type === 'string' && item.data && typeof item.data === 'object'
  );
}

export class WorkflowExecutor {
  async execute(workflowId: string, payload?: Record<string, any>): Promise<string> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
      if (!workflow) throw new Error(`Workflow with ID ${workflowId} not found`);

      await prisma.workflowRun.create({
        data: {
          id: runId,
          workflowId,
          organizationId: workflow.organizationId,
          status: 'PENDING',
          logs: [],
        },
      });

      await prisma.workflowRun.update({ where: { id: runId }, data: { status: 'RUNNING', startedAt: new Date() } });

      const rawNodes = workflow.nodes;
      if (!isWorkflowNodeArray(rawNodes)) {
        throw new Error('Workflow nodes are malformed or not an array');
      }
      const nodes = rawNodes as WorkflowNode[];

      // Check integrations before execution
      const integrationStatus = await checkWorkflowIntegrations(workflow.organizationId, nodes);
      if (!integrationStatus.allConfigured) {
        const missingNames = [...new Set(integrationStatus.missingIntegrations.map(m => m.integrationName))];

        // Emit notification about missing integrations
        emitNotification({
          title: 'Missing Integrations',
          message: `"${workflow.name}" requires: ${missingNames.join(', ')}. Some nodes may fail.`,
          type: 'warning',
          category: 'workflow',
        });

        // Emit event for UI to show missing integrations
        emitDashboardEvent({
          type: 'integration-missing',
          data: {
            workflowId,
            workflowName: workflow.name,
            missing: missingNames,
          },
        });
      }

      const logs: NodeResult[] = [];
      let currentInput: Record<string, any> = payload || {};
      const failedNodes: string[] = [];

      for (const node of nodes) {
        const nodeType = (node.data?.nodeType || node.type) as any;
        const nodeInstance = createNodeInstance(nodeType, node.data?.config ?? {});

        try {
          nodeInstance.validate(node.data?.config ?? {});
        } catch (validationError) {
          throw new Error(`Node ${node.id} (${nodeType}) validation failed: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
        }

        const credentials = await this.getIntegrationCredentials(workflow.organizationId, nodeType);

        const context: NodeExecutionContext = {
          input: currentInput,
          context: {
            workflowId,
            runId,
            organizationId: workflow.organizationId,
            previousResults: logs,
          },
          services: { credentials },
        };

        // Emit node running status
        emitDashboardEvent({
          type: 'node-status',
          data: { runId, nodeId: node.id, status: 'running' },
        });

        const startTime = Date.now();
        let result: any = null;
        let success = true;
        let errorMsg: string | undefined;

        try {
          result = await nodeInstance.execute(context);

          // Check if result indicates partial failure (like alert-send with some channels failing)
          if (result?.output?.successfulChannels !== undefined &&
            result.output.successfulChannels < result.output.totalChannels) {
            // Mark as warning - some channels failed
            console.warn(`Node ${node.id} had partial success: ${result.output.successfulChannels}/${result.output.totalChannels} channels`);
          }
        } catch (executionError) {
          success = false;
          errorMsg = executionError instanceof Error ? executionError.message : String(executionError);
          result = null;
          console.error(`Node ${node.id} (${nodeType}) execution failed:`, executionError);
          console.error('Node config:', node.data?.config);
          failedNodes.push(node.id);
        }

        const duration = Date.now() - startTime;

        // Emit node completion status
        emitDashboardEvent({
          type: 'node-status',
          data: {
            runId,
            nodeId: node.id,
            status: success ? 'success' : 'error',
            error: errorMsg,
          },
        });

        const logEntry: NodeResult = {
          nodeId: node.id,
          success,
          output: result ?? undefined,
          error: errorMsg,
          durationMs: duration,
        };

        logs.push(logEntry);

        currentInput = { ...currentInput, [node.id]: result };

        await prisma.workflowRun.update({
          where: { id: runId },
          data: { logs: logs as any },
        });

        if (!success) {
          throw new Error(`Node ${node.id} (${nodeType}) failed: ${errorMsg}`);
        }
      }

      const finishedRun = await prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
        },
      });

      // Emit real-time event
      emitDashboardEvent({
        type: 'new-run',
        data: {
          id: finishedRun.id,
          workflowId: finishedRun.workflowId,
          workflowName: workflow.name,
          status: finishedRun.status,
          startedAt: finishedRun.startedAt.toISOString(),
          finishedAt: finishedRun.finishedAt?.toISOString(),
          duration: finishedRun.finishedAt
            ? finishedRun.finishedAt.getTime() - finishedRun.startedAt.getTime()
            : null,
        },
      });

      // Send success notification
      emitNotification({
        title: 'Workflow Completed',
        message: `"${workflow.name}" executed successfully in ${Math.round((finishedRun.finishedAt!.getTime() - finishedRun.startedAt.getTime()) / 1000)}s`,
        type: 'success',
        category: 'workflow',
      });

      return runId;
    } catch (error) {
      try {
        const existing = await prisma.workflowRun.findUnique({ where: { id: runId } });
        const existingLogs = Array.isArray(existing?.logs) ? (existing!.logs as any[]) : [];
        const failedEntry: NodeResult = {
          nodeId: 'workflow',
          success: false,
          output: undefined,
          error: error instanceof Error ? error.message : String(error),
          durationMs: 0,
        };
        await prisma.workflowRun.update({
          where: { id: runId },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            logs: [...existingLogs, failedEntry],
          },
        });

        // Emit failure event
        const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
        if (workflow) {
          emitDashboardEvent({
            type: 'new-run',
            data: {
              id: runId,
              workflowId,
              workflowName: workflow.name,
              status: 'FAILED',
              startedAt: new Date().toISOString(),
              finishedAt: new Date().toISOString(),
              duration: 0,
            },
          });

          // Send failure notification
          emitNotification({
            title: 'Workflow Failed',
            message: `"${workflow.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error',
            category: 'workflow',
          });
        }
      } catch (updateError) {
        console.error('Failed to update workflow run status:', updateError);
      }
      throw error;
    }
  }

  private async getIntegrationCredentials(
    organizationId: string,
    nodeType: string
  ): Promise<Record<string, any> | null> {
    const integrationMap: Record<string, string> = {
      'twilio-sms': 'twilio',
      'twilio-whatsapp': 'twilio',
      'whatsapp-group': 'twilio',
      'email-send': 'gmail',
      'slack-send': 'slack',
      'discord-send': 'discord',
    };

    const integrationType = integrationMap[nodeType];
    if (!integrationType) return null;

    try {
      const connection = await prisma.integrationConnection.findFirst({
        where: { organizationId, type: integrationType },
      });
      return (connection?.credentials as any) ?? null;
    } catch (error) {
      console.error('Error fetching integration credentials:', error);
      return null;
    }
  }
}