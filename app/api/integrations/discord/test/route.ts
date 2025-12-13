// app/api/integrations/discord/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl } = body;

        if (!webhookUrl) {
            const envWebhook = process.env.DISCORD_WEBHOOK_URL;
            if (!envWebhook) {
                return NextResponse.json({
                    success: false,
                    error: 'No webhook URL provided',
                    configured: false
                });
            }
        }

        const testWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;

        // Test the webhook by sending a test message
        const testPayload = {
            content: '🔔 EduFlow Integration Test - Discord connection successful!',
            username: 'EduFlow Bot'
        };

        const response = await fetch(testWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({
                success: false,
                error: `Discord API error: ${errorText}`,
                configured: true
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Discord integration is working! Test message sent.',
            configured: true
        });
    } catch (error) {
        console.error('[DISCORD_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            configured: false
        });
    }
}

export async function GET() {
    const configured = !!process.env.DISCORD_WEBHOOK_URL;
    return NextResponse.json({
        configured,
        integration: 'discord',
        status: configured ? 'ready' : 'not_configured'
    });
}
