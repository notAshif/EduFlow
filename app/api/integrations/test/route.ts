/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/integrations/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const testIntegrationSchema = z.object({
  type: z.string(),
  credentials: z.record(z.string(), z.unknown()).optional(),
  integrationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { type, credentials, integrationId } = testIntegrationSchema.parse(body);

    let testCredentials: Record<string, any> | undefined = credentials as Record<string, any> | undefined;

    if (integrationId) {
      const integration = await prisma.integrationConnection.findFirst({
        where: {
          id: integrationId,
          organizationId: user.organizationId,
        },
      });

      if (!integration) {
        return NextResponse.json({ ok: false, error: 'Integration not found' }, { status: 404 });
      }

      testCredentials = integration.credentials as Record<string, any> | undefined;
    }

    let testResult;
    switch (type) {
      case 'twilio':
        testResult = await testTwilio(testCredentials);
        break;
      case 'gmail':
        testResult = await testGmail(testCredentials);
        break;
      case 'slack':
        testResult = await testSlack(testCredentials);
        break;
      case 'discord':
        testResult = await testDiscord(testCredentials);
        break;
      case 'file-storage':
        testResult = await testFileStorage(testCredentials);
        break;
      default:
        return NextResponse.json({ ok: false, error: 'Unknown integration type' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: testResult });
  } catch (error) {
    console.error('Error testing integration:', error);

    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function testTwilio(credentials?: Record<string, any>) {
  if (!credentials?.accountSid || !credentials?.authToken) {
    return { success: false, message: 'Missing Twilio credentials', mock: true };
  }

  const accountSidValid = typeof credentials.accountSid === 'string' && credentials.accountSid.startsWith('AC') && credentials.accountSid.length === 34;
  const authTokenValid = typeof credentials.authToken === 'string' && credentials.authToken.length >= 32;

  return {
    success: accountSidValid && authTokenValid,
    message: accountSidValid && authTokenValid ? 'Twilio credentials appear valid' : 'Invalid Twilio credentials format',
    details: { accountSidValid, authTokenValid },
  };
}

async function testGmail(credentials?: Record<string, any>) {
  if (!credentials?.host || !credentials?.user || !credentials?.pass) {
    return { success: false, message: 'Missing Gmail SMTP credentials', mock: true };
  }

  const hostValid = typeof credentials.host === 'string' && (credentials.host.includes('gmail.com') || credentials.host.includes('google.com'));
  const emailValid = typeof credentials.user === 'string' && credentials.user.includes('@');

  return {
    success: hostValid && emailValid,
    message: hostValid && emailValid ? 'Gmail SMTP credentials appear valid' : 'Invalid Gmail SMTP credentials format',
    details: { hostValid, emailValid },
  };
}

async function testSlack(credentials?: Record<string, any>) {
  if (!credentials?.webhookUrl) {
    return { success: false, message: 'Missing Slack webhook URL', mock: true };
  }

  const urlValid = typeof credentials.webhookUrl === 'string' && credentials.webhookUrl.startsWith('https://hooks.slack.com/');

  return {
    success: urlValid,
    message: urlValid ? 'Slack webhook URL appears valid' : 'Invalid Slack webhook URL format',
    details: { urlValid },
  };
}

async function testDiscord(credentials?: Record<string, any>) {
  if (!credentials?.webhookUrl) {
    return { success: false, message: 'Missing Discord webhook URL', mock: true };
  }

  const urlValid = typeof credentials.webhookUrl === 'string' && credentials.webhookUrl.startsWith('https://discord.com/api/webhooks/');

  return {
    success: urlValid,
    message: urlValid ? 'Discord webhook URL appears valid' : 'Invalid Discord webhook URL format',
    details: { urlValid },
  };
}

async function testFileStorage(_credentials?: Record<string, any>) {
  try {
    const { writeFile, mkdir } = await import('fs/promises');
    const { join } = await import('path');

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const testFile = join(uploadsDir, 'test.txt');
    await writeFile(testFile, 'test');

    const { unlinkSync } = await import('fs');
    unlinkSync(testFile);

    return { success: true, message: 'Local file storage is working' };
  } catch (error) {
    return { success: false, message: `Local file storage error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
