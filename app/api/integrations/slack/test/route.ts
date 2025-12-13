// app/api/integrations/slack/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl } = body;

        if (!webhookUrl) {
            const envWebhook = process.env.SLACK_WEBHOOK_URL;
            if (!envWebhook) {
                return NextResponse.json({
                    success: false,
                    error: 'No webhook URL provided',
                    configured: false
                });
            }
        }

        const testWebhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;

        // Test the webhook by sending a test message
        const testPayload = {
            text: '🔔 EduFlow Integration Test - Slack connection successful!'
        };

        const response = await fetch(testWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload),
        });

        const responseText = await response.text();

        if (!response.ok || responseText !== 'ok') {
            return NextResponse.json({
                success: false,
                error: `Slack API error: ${responseText}`,
                configured: true
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Slack integration is working! Test message sent.',
            configured: true
        });
    } catch (error) {
        console.error('[SLACK_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            configured: false
        });
    }
}

export async function GET() {
    const configured = !!process.env.SLACK_WEBHOOK_URL;
    return NextResponse.json({
        configured,
        integration: 'slack',
        status: configured ? 'ready' : 'not_configured'
    });
}
