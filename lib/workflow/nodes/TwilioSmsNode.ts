/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseNode } from '../node-base';
import { NodeExecutionContext } from '@/lib/types';

export class TwilioSmsNode extends BaseNode {
  validate(config: any): void {
    if (!config.to) throw new Error('Phone number (to) is required');
    if (!config.message) throw new Error('Message is required');
    if (!/^[\d\s\-\+\(\)]+$/.test(config.to)) {
      throw new Error('Invalid phone number format');
    }
  }

  async execute(context: NodeExecutionContext): Promise<any> {
    const { to, message } = this.config;
    const startTime = Date.now();

    console.log('[TWILIO SMS] Starting execution');
    console.log('[TWILIO SMS] To:', to);
    console.log('[TWILIO SMS] Message:', message);

    // Get Twilio credentials from: config > integration credentials > environment
    let twilioAccountSid = this.config.accountSid;
    let twilioAuthToken = this.config.authToken;
    let twilioPhoneFrom = this.config.fromNumber;

    // Try integration credentials
    if ((!twilioAccountSid || !twilioAuthToken) && context.services?.credentials) {
      const creds = context.services.credentials;
      twilioAccountSid = twilioAccountSid || creds.accountSid;
      twilioAuthToken = twilioAuthToken || creds.authToken;
      twilioPhoneFrom = twilioPhoneFrom || creds.phoneNumber || creds.fromNumber;
      if (creds.accountSid) {
        console.log('[TWILIO SMS] Using credentials from integration');
      }
    }

    // Fallback to environment variables
    twilioAccountSid = twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
    twilioAuthToken = twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;
    twilioPhoneFrom = twilioPhoneFrom || process.env.TWILIO_PHONE_NUMBER?.replace('whatsapp:', '') || '+14155238886';

    console.log('[TWILIO SMS] Credentials check:');
    console.log('  - Account SID:', twilioAccountSid ? '✓ Set' : '✗ Not set');
    console.log('  - Auth Token:', twilioAuthToken ? '✓ Set' : '✗ Not set');
    console.log('  - From Number:', twilioPhoneFrom);

    if (!twilioAccountSid || !twilioAuthToken) {
      console.warn('[TWILIO SMS] Credentials not configured - simulating');
      return {
        mock: true,
        preview: `Would send SMS to ${to}: ${message}`,
        to,
        body: message,
        note: 'Configure Twilio in Integration page or set TWILIO_* environment variables',
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      const formattedTo = to.startsWith('+') ? to : `+${to}`;

      console.log('[TWILIO SMS] Sending to:', formattedTo);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: twilioPhoneFrom,
            To: formattedTo,
            Body: message
          }).toString()
        }
      );

      const responseText = await response.text();
      console.log('[TWILIO SMS] Response status:', response.status);

      const data = JSON.parse(responseText);

      if (!response.ok) {
        console.error('[TWILIO SMS] ✗ Failed:', data.message);
        throw new Error(`Twilio SMS failed: ${data.message} (Code: ${data.code})`);
      }

      console.log('[TWILIO SMS] ✓ Success! SID:', data.sid);

      return {
        success: true,
        sid: data.sid,
        to: data.to,
        from: data.from,
        body: message,
        status: data.status,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[TWILIO SMS] ✗ Exception:', error);
      throw new Error(
        `Twilio SMS failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}