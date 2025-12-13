// app/api/integrations/discord/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { message, username, avatarUrl, webhookUrl } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Missing required field: message' },
                { status: 400 }
            );
        }

        // Priority: request body > database > environment variable
        let discordWebhookUrl = webhookUrl;

        // If not in request, check database
        if (!discordWebhookUrl) {
            try {
                const connection = await prisma.integrationConnection.findFirst({
                    where: {
                        organizationId: user.organizationId,
                        type: 'discord'
                    }
                });
                if (connection?.credentials) {
                    const creds = connection.credentials as { webhookUrl?: string };
                    discordWebhookUrl = creds.webhookUrl;
                }
            } catch (e) {
                console.log('[DISCORD] Could not fetch from DB');
            }
        }

        // Fallback to environment variable
        if (!discordWebhookUrl) {
            discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
        }

        if (!discordWebhookUrl) {
            return NextResponse.json(
                { error: 'Discord integration not configured. Please provide webhookUrl, save it in integrations, or set DISCORD_WEBHOOK_URL in environment variables.' },
                { status: 503 }
            );
        }

        console.log('[DISCORD] Sending message');

        const payload: Record<string, string> = { content: message };
        if (username) {
            payload.username = username;
        }
        if (avatarUrl) {
            payload.avatar_url = avatarUrl;
        }

        const response = await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('[DISCORD] API Error:', errorData);
            return NextResponse.json(
                { error: errorData || 'Failed to send Discord message' },
                { status: response.status }
            );
        }

        console.log('[DISCORD] Message sent successfully');

        return NextResponse.json({
            success: true,
            data: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[DISCORD] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send Discord message' },
            { status: 500 }
        );
    }
}

// GET - Check Discord configuration status
export async function GET() {
    try {
        const user = await getCurrentUser();

        // Check environment
        const envConfigured = !!process.env.DISCORD_WEBHOOK_URL;

        // Check database
        let dbConfigured = false;
        if (user?.organizationId) {
            const connection = await prisma.integrationConnection.findFirst({
                where: {
                    organizationId: user.organizationId,
                    type: 'discord'
                }
            });
            dbConfigured = !!connection;
        }

        return NextResponse.json({
            configured: envConfigured || dbConfigured,
            sources: {
                env: envConfigured,
                db: dbConfigured
            }
        });
    } catch (error) {
        return NextResponse.json({
            configured: !!process.env.DISCORD_WEBHOOK_URL,
            sources: { env: !!process.env.DISCORD_WEBHOOK_URL, db: false }
        });
    }
}
