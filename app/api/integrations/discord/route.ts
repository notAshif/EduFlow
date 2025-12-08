// app/api/integrations/discord/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

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

        // Use provided webhookUrl or fallback to env
        const discordWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;

        if (!discordWebhookUrl) {
            return NextResponse.json(
                { error: 'Discord integration not configured. Please provide webhookUrl or set DISCORD_WEBHOOK_URL in environment variables.' },
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
