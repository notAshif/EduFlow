// app/api/integrations/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Check all integration configuration status (env vars + database)
export async function GET() {
    try {
        // Check environment variables
        const envIntegrations = {
            discord: !!process.env.DISCORD_WEBHOOK_URL,
            slack: !!process.env.SLACK_WEBHOOK_URL,
            email: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
            gmail: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
            sms: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
            openai: !!process.env.OPENAI_API_KEY,
        };

        // Also check database for user-specific configurations
        const dbIntegrations: Record<string, boolean> = {};
        try {
            const user = await getCurrentUser();
            if (user?.organizationId) {
                const connections = await prisma.integrationConnection.findMany({
                    where: { organizationId: user.organizationId },
                    select: { type: true }
                });
                connections.forEach(c => {
                    dbIntegrations[c.type] = true;
                });
            }
        } catch (e) {
            // User might not be logged in, that's fine
        }

        // Merge: show as configured if either env OR db has it
        const mergedIntegrations = { ...envIntegrations };
        Object.keys(dbIntegrations).forEach(key => {
            mergedIntegrations[key as keyof typeof mergedIntegrations] = true;
        });

        return NextResponse.json({
            success: true,
            integrations: mergedIntegrations,
            sources: {
                env: envIntegrations,
                db: dbIntegrations
            }
        });
    } catch (error) {
        console.error('[INTEGRATION_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            integrations: {},
            error: 'Failed to check integrations'
        });
    }
}

// POST - Test a specific integration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { integration, config } = body;

        if (!integration) {
            return NextResponse.json({
                success: false,
                error: 'Missing integration type'
            }, { status: 400 });
        }

        // Check database first for stored credentials
        let dbCredentials: any = null;
        try {
            const user = await getCurrentUser();
            if (user?.organizationId) {
                const connection = await prisma.integrationConnection.findFirst({
                    where: {
                        organizationId: user.organizationId,
                        type: integration
                    }
                });
                if (connection) {
                    dbCredentials = connection.credentials;
                }
            }
        } catch (e) {
            // User might not be logged in
        }

        // Merge: config from request > db > env vars
        const effectiveConfig = { ...dbCredentials, ...config };

        // Test based on integration type
        switch (integration) {
            case 'discord':
                if (effectiveConfig?.webhookUrl || process.env.DISCORD_WEBHOOK_URL) {
                    return NextResponse.json({
                        success: true,
                        message: 'Discord webhook configured',
                        configured: true,
                        source: effectiveConfig?.webhookUrl ? 'manual' : 'env'
                    });
                }
                break;

            case 'slack':
                if (effectiveConfig?.webhookUrl || process.env.SLACK_WEBHOOK_URL) {
                    return NextResponse.json({
                        success: true,
                        message: 'Slack webhook configured',
                        configured: true,
                        source: effectiveConfig?.webhookUrl ? 'manual' : 'env'
                    });
                }
                break;

            case 'email':
            case 'gmail':
                const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
                if (smtpConfigured || (effectiveConfig?.email && effectiveConfig?.clientId)) {
                    return NextResponse.json({
                        success: true,
                        message: 'Email integration configured',
                        configured: true,
                        source: smtpConfigured ? 'env' : 'manual'
                    });
                }
                break;

            case 'sms':
                const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
                if (smsConfigured || effectiveConfig?.apiKey) {
                    return NextResponse.json({
                        success: true,
                        message: 'SMS integration configured',
                        configured: true,
                        source: smsConfigured ? 'env' : 'manual'
                    });
                }
                break;

            case 'openai':
                if (process.env.OPENAI_API_KEY || effectiveConfig?.apiKey) {
                    return NextResponse.json({
                        success: true,
                        message: 'OpenAI integration configured',
                        configured: true,
                        source: process.env.OPENAI_API_KEY ? 'env' : 'manual'
                    });
                }
                break;

            // For integrations that support manual config
            case 'google-classroom':
            case 'canvas':
            case 'google-calendar':
            case 'google-drive':
            case 'google-sheets':
            case 'zoom':
            case 'google-meet':
            case 'schoology':
            case 'moodle':
            case 'turnitin':
            case 'gradescope':
            case 'kahoot':
            case 'remind':
            case 'onedrive':
            case 'power-bi':
                if (effectiveConfig && Object.keys(effectiveConfig).some(k => effectiveConfig[k])) {
                    return NextResponse.json({
                        success: true,
                        message: `${integration} configured`,
                        configured: true,
                        source: 'manual'
                    });
                }
                break;

            default:
                // Custom integrations - check if any config exists
                if (effectiveConfig && Object.keys(effectiveConfig).some(k => effectiveConfig[k])) {
                    return NextResponse.json({
                        success: true,
                        message: `${integration} configured`,
                        configured: true,
                        source: 'manual'
                    });
                }
        }

        return NextResponse.json({
            success: false,
            message: `${integration} not configured`,
            configured: false
        });

    } catch (error) {
        console.error('[INTEGRATION_TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Test failed',
            configured: false
        }, { status: 500 });
    }
}
