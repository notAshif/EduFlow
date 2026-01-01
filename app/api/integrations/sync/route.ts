// app/api/integrations/sync/route.ts
// API endpoint to sync integrations between client localStorage and database

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
    syncIntegrationsToDb,
    getIntegrationsFromDb,
    canRestoreFromDb
} from '@/lib/services/integration-persistence';

// POST - Sync integrations from client to database
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { integrations } = body;

        if (!integrations || !Array.isArray(integrations)) {
            return NextResponse.json(
                { error: 'Missing or invalid integrations array' },
                { status: 400 }
            );
        }

        // Filter out integrations that don't have any config
        const validIntegrations = integrations.filter((int: any) => {
            const hasConfig = int.credentials && Object.keys(int.credentials).some(k => int.credentials[k]);
            return hasConfig && int.type;
        });

        // Sync to database
        const result = await syncIntegrationsToDb(user.organizationId, validIntegrations);

        return NextResponse.json({
            success: true,
            synced: result.success,
            failed: result.failed,
            message: `Synced ${result.success} integrations to database`
        });
    } catch (error) {
        console.error('[INTEGRATIONS-SYNC] Error syncing integrations:', error);
        return NextResponse.json(
            { error: 'Failed to sync integrations' },
            { status: 500 }
        );
    }
}

// GET - Get all integrations from database for restoration
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all integrations from database
        const integrations = await getIntegrationsFromDb(user.organizationId);

        // Transform to client-friendly format
        const restorable = integrations.map(integration => ({
            id: integration.id,
            type: integration.type,
            credentials: integration.credentials,
            meta: integration.meta,
            createdAt: integration.createdAt,
            updatedAt: integration.updatedAt,
            canRestore: canRestoreFromDb(integration.type),
            connected: true,
        }));

        return NextResponse.json({
            success: true,
            integrations: restorable,
            count: restorable.length,
        });
    } catch (error) {
        console.error('[INTEGRATIONS-SYNC] Error fetching integrations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}
