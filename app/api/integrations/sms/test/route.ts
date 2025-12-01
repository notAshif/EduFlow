// app/api/integrations/sms/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, message } = body;

        if (!to || !message) {
            return NextResponse.json(
                { ok: false, error: 'Missing required fields: to, message' },
                { status: 400 }
            );
        }

        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

        // If credentials not configured, simulate the send
        if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
            console.log('[SMS TEST] Simulating send (no credentials configured)');
            console.log(`To: ${to}`);
            console.log(`Message: ${message}`);

            return NextResponse.json({
                ok: true,
                simulated: true,
                data: {
                    to,
                    message,
                    status: 'simulated',
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Send actual SMS via Twilio
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: twilioPhoneNumber,
                    To: to,
                    Body: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send SMS');
        }

        return NextResponse.json({
            ok: true,
            simulated: false,
            data: {
                sid: data.sid,
                status: data.status,
                to: data.to,
                from: data.from,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('SMS test send error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to send test SMS'
            },
            { status: 500 }
        );
    }
}
