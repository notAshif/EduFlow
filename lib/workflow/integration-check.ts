/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/workflow/integration-check.ts
// Utility to check if required integrations are configured for a workflow

import { prisma } from '@/lib/db';
import { WorkflowNode } from '@/lib/types';

// Mapping of node types to the integration they require
export const NODE_INTEGRATION_MAP: Record<string, { integration: string; name: string; icon?: string }> = {
    // Twilio-based nodes
    'twilio-sms': { integration: 'twilio', name: 'Twilio SMS' },
    'twilio-whatsapp': { integration: 'twilio', name: 'Twilio WhatsApp' },
    'whatsapp-group': { integration: 'whatsapp', name: 'WhatsApp' },

    // Email
    'email-send': { integration: 'gmail', name: 'Email / Gmail' },
    'alert-send': { integration: 'gmail', name: 'Multi-Channel Alert' }, // Also needs twilio for SMS/WhatsApp

    // Chat
    'slack-send': { integration: 'slack', name: 'Slack' },
    'discord-send': { integration: 'discord', name: 'Discord' },
    'telegram-send': { integration: 'telegram', name: 'Telegram' },

    // Google Suite
    'google-classroom': { integration: 'google-classroom', name: 'Google Classroom' },
    'google-drive': { integration: 'google-drive', name: 'Google Drive' },
    'google-sheets': { integration: 'google-sheets', name: 'Google Sheets' },
    'google-calendar': { integration: 'google-calendar', name: 'Google Calendar' },
    'google-meet': { integration: 'google-meet', name: 'Google Meet' },
    'google-forms': { integration: 'google-forms', name: 'Google Forms' },

    // Microsoft 365
    'microsoft-teams': { integration: 'microsoft', name: 'Microsoft Teams' },
    'microsoft-outlook': { integration: 'microsoft', name: 'Microsoft Outlook' },
    'microsoft-onedrive': { integration: 'onedrive', name: 'Microsoft OneDrive' },
    'microsoft-excel': { integration: 'microsoft', name: 'Microsoft Excel' },

    // Video
    'zoom-meeting': { integration: 'zoom', name: 'Zoom' },
    'zoom-recording': { integration: 'zoom', name: 'Zoom' },

    // AI
    'local-ai': { integration: 'openai', name: 'OpenAI/ChatGPT' },
    'ai-summarize': { integration: 'openai', name: 'OpenAI/ChatGPT' },
    'ai-translate': { integration: 'openai', name: 'OpenAI/ChatGPT' },
    'ai-sentiment': { integration: 'openai', name: 'OpenAI/ChatGPT' },
};

// Special nodes like alert-send that use multiple integrations
export const MULTI_INTEGRATION_NODES: Record<string, string[]> = {
    'alert-send': ['twilio', 'gmail'],
};

// Environment variable fallbacks for some integrations
const ENV_FALLBACKS: Record<string, string[]> = {
    'twilio': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
    'gmail': ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'],
    'slack': ['SLACK_WEBHOOK_URL'],
    'discord': ['DISCORD_WEBHOOK_URL'],
    'whatsapp': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_WHATSAPP_FROM'],
    'openai': ['OPENAI_API_KEY'],
};

export interface IntegrationCheckResult {
    configured: boolean;
    nodeType: string;
    nodeId: string;
    nodeLabel: string;
    requiredIntegration: string;
    integrationName: string;
    hasEnvFallback: boolean;
}

export interface WorkflowIntegrationStatus {
    allConfigured: boolean;
    missingIntegrations: IntegrationCheckResult[];
    configuredIntegrations: IntegrationCheckResult[];
    nodeStatuses: Map<string, { hasIntegration: boolean; integrationName: string }>;
}

/**
 * Check if an integration is configured via environment variables
 */
function checkEnvFallback(integrationType: string): boolean {
    const requiredEnvVars = ENV_FALLBACKS[integrationType];
    if (!requiredEnvVars) return false;

    return requiredEnvVars.every(envVar => !!process.env[envVar]);
}

/**
 * Get the required integrations for a set of workflow nodes
 */
export function getRequiredIntegrations(nodes: WorkflowNode[]): Map<string, Set<string>> {
    const integrations = new Map<string, Set<string>>();

    for (const node of nodes) {
        const nodeType = node.data?.nodeType || node.type;
        const info = NODE_INTEGRATION_MAP[nodeType];

        if (info) {
            if (!integrations.has(info.integration)) {
                integrations.set(info.integration, new Set());
            }
            integrations.get(info.integration)!.add(node.id);
        }

        // Handle multi-integration nodes
        const multiIntegrations = MULTI_INTEGRATION_NODES[nodeType];
        if (multiIntegrations) {
            for (const integ of multiIntegrations) {
                if (!integrations.has(integ)) {
                    integrations.set(integ, new Set());
                }
                integrations.get(integ)!.add(node.id);
            }
        }
    }

    return integrations;
}

/**
 * Check if all required integrations for a workflow are configured
 */
export async function checkWorkflowIntegrations(
    organizationId: string,
    nodes: WorkflowNode[]
): Promise<WorkflowIntegrationStatus> {
    const requiredIntegrations = getRequiredIntegrations(nodes);
    const missingIntegrations: IntegrationCheckResult[] = [];
    const configuredIntegrations: IntegrationCheckResult[] = [];
    const nodeStatuses = new Map<string, { hasIntegration: boolean; integrationName: string }>();

    // Fetch all configured integrations for the organization
    const configuredDbIntegrations = await prisma.integrationConnection.findMany({
        where: { organizationId },
        select: { type: true },
    });
    const configuredTypes = new Set(configuredDbIntegrations.map(i => i.type));

    for (const node of nodes) {
        const nodeType = node.data?.nodeType || node.type;
        const info = NODE_INTEGRATION_MAP[nodeType];

        if (!info) {
            // No integration required for this node
            nodeStatuses.set(node.id, { hasIntegration: true, integrationName: '' });
            continue;
        }

        // Check if configured in DB or via environment
        const isDbConfigured = configuredTypes.has(info.integration);
        const hasEnvFallback = checkEnvFallback(info.integration);
        const isConfigured = isDbConfigured || hasEnvFallback;

        const result: IntegrationCheckResult = {
            configured: isConfigured,
            nodeType,
            nodeId: node.id,
            nodeLabel: node.data?.label || nodeType,
            requiredIntegration: info.integration,
            integrationName: info.name,
            hasEnvFallback,
        };

        if (isConfigured) {
            configuredIntegrations.push(result);
        } else {
            missingIntegrations.push(result);
        }

        nodeStatuses.set(node.id, {
            hasIntegration: isConfigured,
            integrationName: info.name,
        });

        // Handle multi-integration nodes
        const multiIntegrations = MULTI_INTEGRATION_NODES[nodeType];
        if (multiIntegrations) {
            for (const integ of multiIntegrations) {
                const integIsConfigured = configuredTypes.has(integ) || checkEnvFallback(integ);
                if (!integIsConfigured) {
                    // Update node status to false if any required integration is missing
                    nodeStatuses.set(node.id, {
                        hasIntegration: false,
                        integrationName: `${info.name} (needs ${integ})`,
                    });
                }
            }
        }
    }

    return {
        allConfigured: missingIntegrations.length === 0,
        missingIntegrations,
        configuredIntegrations,
        nodeStatuses,
    };
}

/**
 * Get a user-friendly summary of missing integrations
 */
export function getMissingIntegrationsSummary(status: WorkflowIntegrationStatus): string {
    if (status.allConfigured) {
        return 'All integrations are configured';
    }

    const uniqueIntegrations = new Set(status.missingIntegrations.map(m => m.integrationName));
    const names = Array.from(uniqueIntegrations);

    if (names.length === 1) {
        return `Configure ${names[0]} in Integrations to enable this workflow`;
    }

    return `Configure ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} in Integrations`;
}
