// app/api/integrations/discord/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { webhookUrl, message } = body;

        // Use provided webhook URL or fall back to environment variable
        const discordWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;

        if (!discordWebhookUrl) {
            return NextResponse.json(
                { 
                    ok: false, 
                    error: 'No Discord webhook URL provided. Either enter a webhook URL or set DISCORD_WEBHOOK_URL in your environment variables.' 
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

        console.log('[DISCORD TEST] Sending message to Discord');
        console.log('Using webhook:', discordWebhookUrl.substring(0, 50) + '...');

        // Send message to Discord webhook
        const response = await fetch(discordWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[DISCORD TEST] Error:', errorText);
            
            let errorMessage = `Discord API error: ${errorText}`;
            if (response.status === 404) {
                errorMessage = 'Invalid webhook URL. Please check your Discord webhook URL.';
            }
            
            throw new Error(errorMessage);
        }

        console.log('[DISCORD TEST] Message sent successfully');

        return NextResponse.json({
            ok: true,
            data: {
                message,
                timestamp: new Date().toISOString(),
                webhookUsed: webhookUrl ? 'provided' : 'environment'
            }
        });
    } catch (error) {
        console.error('[DISCORD TEST] Error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to send Discord message'
            },
            { status: 500 }
        );
    }
}