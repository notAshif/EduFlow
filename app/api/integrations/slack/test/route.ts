// app/api/integrations/slack/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl, message } = body;

        // Use provided webhook URL or fall back to environment variable
        const slackWebhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;

        if (!slackWebhookUrl) {
            return NextResponse.json(
                { 
                    ok: false, 
                    error: 'No Slack webhook URL provided. Either enter a webhook URL or set SLACK_WEBHOOK_URL in your environment variables.' 
                },
                { status: 400 }
            );
        }

        if (!message) {
            return NextResponse.json(
                { ok: false, error: 'Missing required field: message' },
                { status: 400 }
            );
        }

        console.log('[SLACK TEST] Sending message to Slack');
        console.log('Using webhook:', slackWebhookUrl.substring(0, 50) + '...');

        // Send message to Slack webhook
        const response = await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: message
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[SLACK TEST] Error:', errorText);
            
            let errorMessage = `Slack API error: ${errorText}`;
            if (response.status === 404) {
                errorMessage = 'Invalid webhook URL. Please check your Slack webhook URL.';
            }
            
            throw new Error(errorMessage);
        }

        console.log('[SLACK TEST] Message sent successfully');

        return NextResponse.json({
            ok: true,
            data: {
                message,
                timestamp: new Date().toISOString(),
                webhookUsed: webhookUrl ? 'provided' : 'environment'
            }
        });
    } catch (error) {
        console.error('[SLACK TEST] Error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to send Slack message'
            },
            { status: 500 }
        );
    }
}