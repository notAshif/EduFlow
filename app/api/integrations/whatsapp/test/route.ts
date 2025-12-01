// app/api/integrations/whatsapp/test/route.ts
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
        const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;

        if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppFrom) {
            return NextResponse.json({
                ok: true,
                simulated: true,
                data: {
                    to,
                    message,
                    status: 'simulated',
                    timestamp: new Date().toISOString(),
                    note: 'Configure Twilio credentials in .env file'
                }
            });
        }

        const fromNumber = twilioWhatsAppFrom.startsWith('whatsapp:') 
            ? twilioWhatsAppFrom 
            : `whatsapp:${twilioWhatsAppFrom}`;
        
        const toNumber = to.startsWith('whatsapp:') 
            ? to 
            : `whatsapp:${to}`;

        console.log('[WHATSAPP TEST] Sending message');
        console.log('From:', fromNumber);
        console.log('To:', toNumber);

        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: fromNumber,
                    To: toNumber,
                    Body: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('[WHATSAPP TEST] Twilio API Error:', data);
            
            let errorMessage = data.message || 'Failed to send WhatsApp message';
            
            if (data.code === 21606 || errorMessage.includes('Channel')) {
                errorMessage = `Invalid WhatsApp number. Make sure the recipient has joined the WhatsApp Sandbox by sending "join <code>" to ${fromNumber}`;
            }
            
            throw new Error(errorMessage);
        }

        console.log('[WHATSAPP TEST] Message sent successfully:', data.sid);
        console.log('[WHATSAPP TEST] Status:', data.status);
        console.log('[WHATSAPP TEST] Error Code:', data.error_code);
        console.log('[WHATSAPP TEST] Error Message:', data.error_message);

        // Return more detailed status
        return NextResponse.json({
            ok: true,
            simulated: false,
            data: {
                sid: data.sid,
                status: data.status,
                to: data.to,
                from: data.from,
                timestamp: new Date().toISOString(),
                errorCode: data.error_code,
                errorMessage: data.error_message,
                // Add helpful message if status indicates potential issues
                note: data.status === 'queued' || data.status === 'sent' 
                    ? 'If you don\'t receive the message, make sure you\'ve joined the WhatsApp Sandbox'
                    : undefined
            }
        });
    } catch (error) {
        console.error('[WHATSAPP TEST] Error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to send test message'
            },
            { status: 500 }
        );
    }
}