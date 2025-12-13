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

    // Get SMTP config from: config > integration credentials > environment
    let smtpHost = this.config.smtpHost;
    let smtpPort = this.config.smtpPort;
    let smtpUser = this.config.smtpUser;
    let smtpPass = this.config.smtpPass;

    // Try integration credentials
    if ((!smtpHost || !smtpUser || !smtpPass) && context.services?.credentials) {
      const creds = context.services.credentials;
      smtpHost = smtpHost || creds.host;
      smtpPort = smtpPort || creds.port;
      smtpUser = smtpUser || creds.user;
      smtpPass = smtpPass || creds.pass;
      if (creds.host) {
        console.log('[EMAIL] Using SMTP credentials from integration');
      }
    }

    // Fallback to environment variables
    smtpHost = smtpHost || process.env.SMTP_HOST;
    smtpPort = smtpPort || process.env.SMTP_PORT || '587';
    smtpUser = smtpUser || process.env.SMTP_USER;
    smtpPass = smtpPass || process.env.SMTP_PASS;

    console.log('[EMAIL] SMTP Configuration:');
    console.log('  - Host:', smtpHost || '✗ Not set');
    console.log('  - Port:', smtpPort || '✗ Not set');
    console.log('  - User:', smtpUser || '✗ Not set');
    console.log('  - Pass:', smtpPass ? '✓ Set' : '✗ Not set');

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[EMAIL] SMTP not configured - simulating email send');
      return {
        mock: true,
        preview: `Would send email to ${to}`,
        to,
        subject,
        body,
        note: 'Configure SMTP in Integration page or set SMTP_* environment variables for real email sending',
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
        port: parseInt(smtpPort.toString()),
        secure: parseInt(smtpPort.toString()) === 465,
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
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${subject}</h2>
          <div style="white-space: pre-wrap;">${body}</div>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">Sent via EduFlow</p>
        </div>`,
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