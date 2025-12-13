// app/api/workflows/[id]/integrations/route.ts
// Check which integrations a workflow needs and their status

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { WorkflowNode } from '@/lib/types';
import { checkWorkflowIntegrations, getMissingIntegrationsSummary } from '@/lib/workflow/integration-check';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id: workflowId } = await params;

        // Get the user's organization
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { organizationId: true },
        });

        if (!user) {
            return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
        }

        // Get the workflow
        const workflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                organizationId: user.organizationId,
            },
        });

        if (!workflow) {
            return NextResponse.json({ ok: false, error: 'Workflow not found' }, { status: 404 });
        }

        // Parse nodes
        const nodes = workflow.nodes as unknown as WorkflowNode[];
        if (!Array.isArray(nodes)) {
            return NextResponse.json({
                ok: true,
                data: {
                    allConfigured: true,
                    missing: [],
                    configured: [],
                    message: 'No nodes to check',
                },
            });
        }

        // Check integrations
        const status = await checkWorkflowIntegrations(user.organizationId, nodes);

        return NextResponse.json({
            ok: true,
            data: {
                allConfigured: status.allConfigured,
                missing: status.missingIntegrations.map(m => ({
                    nodeId: m.nodeId,
                    nodeType: m.nodeType,
                    nodeLabel: m.nodeLabel,
                    integration: m.requiredIntegration,
                    integrationName: m.integrationName,
                    hasEnvFallback: m.hasEnvFallback,
                })),
                configured: status.configuredIntegrations.map(c => ({
                    nodeId: c.nodeId,
                    nodeType: c.nodeType,
                    nodeLabel: c.nodeLabel,
                    integration: c.requiredIntegration,
                    integrationName: c.integrationName,
                })),
                nodeStatuses: Object.fromEntries(status.nodeStatuses),
                message: getMissingIntegrationsSummary(status),
            },
        });
    } catch (error) {
        console.error('Error checking workflow integrations:', error);
        return NextResponse.json(
            { ok: false, error: 'Failed to check integrations' },
            { status: 500 }
        );
    }
}
