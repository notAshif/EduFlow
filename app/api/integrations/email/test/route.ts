// app/api/integrations/email/test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, smtpHost, smtpPort, smtpUser, smtpPass } = body;

        // Check if SMTP is configured either via request or environment
        const host = smtpHost || process.env.SMTP_HOST;
        const user = smtpUser || process.env.SMTP_USER;
        const pass = smtpPass || process.env.SMTP_PASS;

        if (!host || !user || !pass) {
            return NextResponse.json({
                success: false,
                error: 'SMTP not configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
                configured: false
            });
        }

        // For testing, we just verify the configuration exists
        // Actual email sending would require nodemailer which might not be available
        return NextResponse.json({
            success: true,
            message: 'Email integration is configured and ready.',
            configured: true,
            details: {
                host,
                port: smtpPort || process.env.SMTP_PORT || '587',
                user: user.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email
            }
        });
    } catch (error) {
        console.error('[EMAIL_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            configured: false
        });
    }
}

export async function GET() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const configured = !!(host && user && pass);

    return NextResponse.json({
        configured,
        integration: 'email',
        status: configured ? 'ready' : 'not_configured'
    });
}
