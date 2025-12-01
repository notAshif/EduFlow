// app/api/integrations/email/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { to, subject, message } = body;

        if (!to || !subject || !message) {
            return NextResponse.json(
                { ok: false, error: 'Missing required fields: to, subject, message' },
                { status: 400 }
            );
        }

        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = process.env.SMTP_PORT;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        // If credentials not configured, simulate the send
        if (!smtpHost || !smtpUser || !smtpPass) {
            console.log('[EMAIL TEST] Simulating send (no credentials configured)');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${message}`);

            return NextResponse.json({
                ok: true,
                simulated: true,
                data: {
                    to,
                    subject,
                    message,
                    status: 'simulated',
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Send actual email via SMTP
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort || '587'),
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const info = await transporter.sendMail({
            from: smtpUser,
            to,
            subject,
            text: message,
            html: `<p>${message}</p>`,
        });

        return NextResponse.json({
            ok: true,
            simulated: false,
            data: {
                messageId: info.messageId,
                to,
                subject,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Email test send error:', error);
        return NextResponse.json(
            {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to send test email'
            },
            { status: 500 }
        );
    }
}
