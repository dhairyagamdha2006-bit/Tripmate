import { Resend } from 'resend';

import type { NotificationProvider } from './contracts';
import type { NotificationPayload } from '@/types/travel';
import { renderEmail } from './email-templates';

export class ResendNotificationProvider implements NotificationProvider {
  name = 'resend';

  async send(input: NotificationPayload): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');

    const from = process.env.EMAIL_FROM ?? 'Tripmate <noreply@tripmate.app>';
    const client = new Resend(apiKey);
    const { html, text } = renderEmail(input);

    const result = await client.emails.send({
      from,
      to: input.toName ? `${input.toName} <${input.toEmail}>` : input.toEmail,
      subject: input.subject,
      html,
      text
    });

    if (result.error) {
      throw new Error(`Resend send failed: ${result.error.message ?? String(result.error)}`);
    }
  }
}
