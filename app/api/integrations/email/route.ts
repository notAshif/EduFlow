// app/api/integrations/email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { to, subject, message, html, smtpConfig } = body;

        if (!to || !subject || (!message && !html)) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, and message or html' },
                { status: 400 }
            );
        }

        // Priority: request body > database > environment variables
        let smtpHost = smtpConfig?.host;
        let smtpPort = smtpConfig?.port;
        let smtpUser = smtpConfig?.user;
        let smtpPass = smtpConfig?.pass;
        let smtpFrom = smtpConfig?.from;

        // Check database for stored credentials
        if (!smtpHost || !smtpUser || !smtpPass) {
            try {
                const connection = await prisma.integrationConnection.findFirst({
                    where: {
                        organizationId: user.organizationId,
                        type: 'email'
                    }
                });
                if (connection?.credentials) {
                    const creds = connection.credentials as {
                        host?: string;
                        port?: number;
                        user?: string;
                        pass?: string;
                        from?: string;
                    };
                    smtpHost = smtpHost || creds.host;
                    smtpPort = smtpPort || creds.port;
                    smtpUser = smtpUser || creds.user;
                    smtpPass = smtpPass || creds.pass;
                    smtpFrom = smtpFrom || creds.from;
                }
            } catch (e) {
                console.log('[EMAIL] Could not fetch from DB');
            }
        }

        // Fallback to environment variables
        smtpHost = smtpHost || process.env.SMTP_HOST;
        smtpPort = smtpPort || parseInt(process.env.SMTP_PORT || '587');
        smtpUser = smtpUser || process.env.SMTP_USER;
        smtpPass = smtpPass || process.env.SMTP_PASS;
        smtpFrom = smtpFrom || process.env.SMTP_FROM || smtpUser;

        if (!smtpHost || !smtpUser || !smtpPass) {
            return NextResponse.json(
                { error: 'Email integration not configured. Please set SMTP credentials in integrations or environment variables.' },
                { status: 503 }
            );
        }

        console.log('[EMAIL] Sending email');
        console.log('[EMAIL] To:', to);
        console.log('[EMAIL] Subject:', subject);

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: typeof smtpPort === 'number' ? smtpPort : parseInt(smtpPort as string),
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

// GET - Check email configuration status
export async function GET() {
    try {
        const user = await getCurrentUser();

        // Check environment
        const envConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

        // Check database
        let dbConfigured = false;
        if (user?.organizationId) {
            const connection = await prisma.integrationConnection.findFirst({
                where: {
                    organizationId: user.organizationId,
                    type: 'email'
                }
            });
            dbConfigured = !!connection;
        }

        return NextResponse.json({
            configured: envConfigured || dbConfigured,
            sources: {
                env: envConfigured,
                db: dbConfigured
            }
        });
    } catch (error) {
        const envConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
        return NextResponse.json({
            configured: envConfigured,
            sources: { env: envConfigured, db: false }
        });
    }
}
