// app/api/integrations/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { to, message } = body;

        if (!to || !message) {
            return NextResponse.json(
                { error: 'Missing required fields: to, message' },
                { status: 400 }
            );
        }

        const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
        let twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;

        if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppFrom) {
            return NextResponse.json(
                { error: 'WhatsApp integration not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM in environment variables.' },
                { status: 503 }
            );
        }

        // Ensure whatsapp: prefix
        if (!twilioWhatsAppFrom.startsWith('whatsapp:')) {
            twilioWhatsAppFrom = `whatsapp:${twilioWhatsAppFrom}`;
        }

        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        console.log('[WHATSAPP] Sending message');
        console.log('[WHATSAPP] From:', twilioWhatsAppFrom);
        console.log('[WHATSAPP] To:', toNumber);

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: twilioWhatsAppFrom,
                    To: toNumber,
                    Body: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[WHATSAPP] Twilio API Error:', data);
            return NextResponse.json(
                { error: data.message || 'Failed to send WhatsApp message', code: data.code },
                { status: response.status }
            );
        }

        console.log('[WHATSAPP] Message sent successfully:', data.sid);

        return NextResponse.json({
            success: true,
            data: {
                sid: data.sid,
                status: data.status,
                to: data.to,
                from: data.from,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[WHATSAPP] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send WhatsApp message' },
            { status: 500 }
        );
    }
}
