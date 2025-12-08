// app/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all integrations for the current user's organization
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const integrations = await prisma.integrationConnection.findMany({
            where: { organizationId: user.organizationId },
            select: {
                id: true,
                type: true,
                meta: true,
                createdAt: true,
                updatedAt: true,
            }
        });

        // Map integrations to include connection status
        const integrationStatus = integrations.map(integration => ({
            ...integration,
            connected: true,
        }));

        return NextResponse.json({ integrations: integrationStatus });
    } catch (error) {
        console.error('[INTEGRATIONS] Error fetching integrations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch integrations' },
            { status: 500 }
        );
    }
}

// POST - Create or update an integration connection
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, credentials, meta } = body;

        if (!type || !credentials) {
            return NextResponse.json(
                { error: 'Missing required fields: type, credentials' },
                { status: 400 }
            );
        }

        // Upsert the integration connection
        const integration = await prisma.integrationConnection.upsert({
            where: {
                organizationId_type: {
                    organizationId: user.organizationId,
                    type: type,
                }
            },
            update: {
                credentials,
                meta: meta || {},
                updatedAt: new Date(),
            },
            create: {
                type,
                credentials,
                meta: meta || {},
                organizationId: user.organizationId,
            },
        });

        return NextResponse.json({
            success: true,
            integration: {
                id: integration.id,
                type: integration.type,
                connected: true,
                createdAt: integration.createdAt,
            }
        });
    } catch (error) {
        console.error('[INTEGRATIONS] Error saving integration:', error);
        return NextResponse.json(
            { error: 'Failed to save integration' },
            { status: 500 }
        );
    }
}

// DELETE - Remove an integration connection
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type) {
            return NextResponse.json(
                { error: 'Missing required parameter: type' },
                { status: 400 }
            );
        }

        await prisma.integrationConnection.deleteMany({
            where: {
                organizationId: user.organizationId,
                type: type,
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[INTEGRATIONS] Error deleting integration:', error);
        return NextResponse.json(
            { error: 'Failed to delete integration' },
            { status: 500 }
        );
    }
}
