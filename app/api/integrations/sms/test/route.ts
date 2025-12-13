// app/api/integrations/sms/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { apiKey, phoneNumber } = body;

        // Check if SMS is configured via request or environment
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

        const configured = !!(twilioSid && twilioToken && twilioPhone) || !!apiKey;

        if (!configured) {
            return NextResponse.json({
                success: false,
                error: 'SMS not configured. Please set Twilio credentials or provide an API key.',
                configured: false
            });
        }

        // For testing, verify configuration exists
        return NextResponse.json({
            success: true,
            message: 'SMS integration is configured and ready.',
            configured: true,
            provider: twilioSid ? 'Twilio' : 'Custom API'
        });
    } catch (error) {
        console.error('[SMS_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            configured: false
        });
    }
}

export async function GET() {
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const configured = !!(twilioSid && twilioToken);

    return NextResponse.json({
        configured,
        integration: 'sms',
        status: configured ? 'ready' : 'not_configured',
        provider: configured ? 'Twilio' : null
    });
}
