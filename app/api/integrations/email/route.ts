// app/api/integrations/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { to, subject, message, html } = body;

        if (!to || !subject || (!message && !html)) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, and message or html' },
                { status: 400 }
            );
        }

        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const smtpFrom = process.env.SMTP_FROM || smtpUser;

        if (!smtpHost || !smtpUser || !smtpPass) {
            return NextResponse.json(
                { error: 'Email integration not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.' },
                { status: 503 }
            );
        }

        console.log('[EMAIL] Sending email');
        console.log('[EMAIL] To:', to);
        console.log('[EMAIL] Subject:', subject);

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const recipients = typeof to === 'string' ? to.split(',').map(r => r.trim()) : to;

        const info = await transporter.sendMail({
            from: smtpFrom,
            to: recipients.join(', '),
            subject: subject,
            text: message,
            html: html || undefined,
        });

        console.log('[EMAIL] Email sent successfully:', info.messageId);

        return NextResponse.json({
            success: true,
            data: {
                messageId: info.messageId,
                accepted: info.accepted,
                rejected: info.rejected,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[EMAIL] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send email' },
            { status: 500 }
        );
    }
}
