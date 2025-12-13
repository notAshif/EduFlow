// app/api/integrations/whatsapp/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phoneNumber, apiKey } = body;

        // Check WhatsApp Business API configuration
        const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        const wabaToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const wabaPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;

        const configured = !!(wabaId && wabaToken && wabaPhone) || !!apiKey;

        if (!configured) {
            return NextResponse.json({
                success: false,
                error: 'WhatsApp not configured. Please set WhatsApp Business API credentials.',
                configured: false
            });
        }

        // For testing, verify configuration exists
        return NextResponse.json({
            success: true,
            message: 'WhatsApp integration is configured and ready.',
            configured: true,
            provider: wabaId ? 'WhatsApp Business API' : 'Custom API'
        });
    } catch (error) {
        console.error('[WHATSAPP_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            configured: false
        });
    }
}

export async function GET() {
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const wabaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const configured = !!(wabaId && wabaToken);

    return NextResponse.json({
        configured,
        integration: 'whatsapp',
        status: configured ? 'ready' : 'not_configured',
        provider: configured ? 'WhatsApp Business API' : null
    });
}
