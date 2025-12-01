/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class EmailSendNode extends BaseNode {
  validate(config: any): void {
    if (!config.to) throw new Error('Recipient email (to) is required');
    if (!config.subject) throw new Error('Subject is required');
    if (!config.body) throw new Error('Email body is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.to)) {
      throw new Error('Invalid recipient email format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const { to, subject, body, from } = this.config;
    const startTime = Date.now();

    console.log('[EMAIL] Starting execution');
    console.log('[EMAIL] To:', to);
    console.log('[EMAIL] Subject:', subject);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    console.log('[EMAIL] SMTP Configuration:');
    console.log('  - Host:', smtpHost || '✗ Not set');
    console.log('  - Port:', smtpPort || '✗ Not set');
    console.log('  - User:', smtpUser || '✗ Not set');
    console.log('  - Pass:', smtpPass ? '✓ Set' : '✗ Not set');

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[EMAIL] SMTP not configured - simulating');
      return {
        mock: true,
        preview: `Would send email to ${to}`,
        to,
        subject,
        body,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }

    try {
      // Using nodemailer for actual email sending
      const nodemailer = await import('nodemailer');
      
      console.log('[EMAIL] Creating transporter...');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: false, // Use TLS
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      console.log('[EMAIL] Verifying connection...');
      await transporter.verify();
      console.log('[EMAIL] ✓ Connection verified');

      console.log('[EMAIL] Sending email...');
      const info = await transporter.sendMail({
        from: from || smtpUser,
        to: to,
        subject: subject,
        text: body,
        html: `<pre>${body}</pre>`,
      });

      console.log('[EMAIL] ✓ Success! Message ID:', info.messageId);

      return {
        success: true,
        messageId: info.messageId,
        to,
        from: from || smtpUser,
        subject,
        status: 'sent',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[EMAIL] ✗ Exception:', error);
      throw new Error(
        `Email send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}