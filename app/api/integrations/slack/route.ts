// app/api/integrations/slack/route.ts
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
        const { message, channel, webhookUrl } = body;

        if (!message) {
            return NextResponse.json(
                { error: 'Missing required field: message' },
                { status: 400 }
            );
        }

        // Priority: request body > database > environment variable
        let slackWebhookUrl = webhookUrl;

        // If not in request, check database
        if (!slackWebhookUrl) {
            try {
                const connection = await prisma.integrationConnection.findFirst({
                    where: {
                        organizationId: user.organizationId,
                        type: 'slack'
                    }
                });
                if (connection?.credentials) {
                    const creds = connection.credentials as { webhookUrl?: string };
                    slackWebhookUrl = creds.webhookUrl;
                }
            } catch (e) {
                console.log('[SLACK] Could not fetch from DB');
            }
        }

        // Fallback to environment variable
        if (!slackWebhookUrl) {
            slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
        }

        if (!slackWebhookUrl) {
            return NextResponse.json(
                { error: 'Slack integration not configured. Please provide webhookUrl, save it in integrations, or set SLACK_WEBHOOK_URL in environment variables.' },
                { status: 503 }
            );
        }

        console.log('[SLACK] Sending message');
        console.log('[SLACK] Channel:', channel || 'default');

        const payload: Record<string, string> = { text: message };
        if (channel) {
            payload.channel = channel;
        }

        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        if (!response.ok || responseText !== 'ok') {
            console.error('[SLACK] API Error:', responseText);
            return NextResponse.json(
                { error: responseText || 'Failed to send Slack message' },
                { status: response.status }
            );
        }

        console.log('[SLACK] Message sent successfully');

        return NextResponse.json({
            success: true,
            data: {
                channel: channel || 'default',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[SLACK] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send Slack message' },
            { status: 500 }
        );
    }
}

// GET - Check Slack configuration status
export async function GET() {
    try {
        const user = await getCurrentUser();

        // Check environment
        const envConfigured = !!process.env.SLACK_WEBHOOK_URL;

        // Check database
        let dbConfigured = false;
        if (user?.organizationId) {
            const connection = await prisma.integrationConnection.findFirst({
                where: {
                    organizationId: user.organizationId,
                    type: 'slack'
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
            configured: !!process.env.SLACK_WEBHOOK_URL,
            sources: { env: !!process.env.SLACK_WEBHOOK_URL, db: false }
        });
    }
}
