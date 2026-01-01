// lib/services/integration-persistence.ts
// Service to persist and restore integrations from both database and localStorage

import { prisma } from '@/lib/db';

export interface IntegrationData {
    type: string;
    credentials: Record<string, any>;
    meta?: Record<string, any>;
    connectedAt?: string;
    lastSyncedAt?: string;
}

export interface SavedIntegration {
    id: string;
    type: string;
    credentials: Record<string, any>;
    meta: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Save an integration to the database
 */
export async function saveIntegrationToDb(
    organizationId: string,
    data: IntegrationData
): Promise<SavedIntegration> {
    const integration = await prisma.integrationConnection.upsert({
        where: {
            organizationId_type: {
                organizationId,
                type: data.type,
            },
        },
        update: {
            credentials: data.credentials,
            meta: {
                ...(data.meta || {}),
                lastSyncedAt: new Date().toISOString(),
            },
            updatedAt: new Date(),
        },
        create: {
            type: data.type,
            credentials: data.credentials,
            meta: {
                ...(data.meta || {}),
                connectedAt: data.connectedAt || new Date().toISOString(),
            },
            organizationId,
        },
    });

    return integration as SavedIntegration;
}

/**
 * Get all integrations for an organization from the database
 */
export async function getIntegrationsFromDb(
    organizationId: string
): Promise<SavedIntegration[]> {
    const integrations = await prisma.integrationConnection.findMany({
        where: { organizationId },
    });

    return integrations as SavedIntegration[];
}

/**
 * Get a specific integration by type from the database
 */
export async function getIntegrationByType(
    organizationId: string,
    type: string
): Promise<SavedIntegration | null> {
    const integration = await prisma.integrationConnection.findUnique({
        where: {
            organizationId_type: {
                organizationId,
                type,
            },
        },
    });

    return integration as SavedIntegration | null;
}

/**
 * Delete an integration from the database
 */
export async function deleteIntegrationFromDb(
    organizationId: string,
    type: string
): Promise<boolean> {
    try {
        await prisma.integrationConnection.deleteMany({
            where: {
                organizationId,
                type,
            },
        });
        return true;
    } catch (error) {
        console.error('[INTEGRATION-PERSISTENCE] Failed to delete integration:', error);
        return false;
    }
}

/**
 * Sync multiple integrations to the database
 */
export async function syncIntegrationsToDb(
    organizationId: string,
    integrations: IntegrationData[]
): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const integration of integrations) {
        try {
            await saveIntegrationToDb(organizationId, integration);
            success++;
        } catch (error) {
            console.error(`[INTEGRATION-PERSISTENCE] Failed to sync ${integration.type}:`, error);
            failed++;
        }
    }

    return { success, failed };
}

/**
 * Integration types that require special handling
 */
export const SPECIAL_INTEGRATIONS = {
    'whatsapp-web': {
        requiresLiveConnection: true,
        canPersistSession: false, // WhatsApp Web session cannot be serialized to DB on serverless
        description: 'WhatsApp Web requires a live browser session'
    },
    'google-classroom': {
        requiresLiveConnection: false,
        canPersistSession: true,
        description: 'OAuth tokens can be refreshed'
    },
    'slack': {
        requiresLiveConnection: false,
        canPersistSession: true,
        description: 'Webhook URL persists across sessions'
    },
    'discord': {
        requiresLiveConnection: false,
        canPersistSession: true,
        description: 'Webhook URL persists across sessions'
    },
};

/**
 * Check if an integration can be fully restored from database
 */
export function canRestoreFromDb(type: string): boolean {
    const special = SPECIAL_INTEGRATIONS[type as keyof typeof SPECIAL_INTEGRATIONS];
    return special ? special.canPersistSession : true;
}
