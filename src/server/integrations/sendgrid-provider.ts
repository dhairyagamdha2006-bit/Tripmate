import type { EmailProvider } from './contracts';
import type { NotificationPayload } from '@/types/travel';

export class SendGridProvider implements EmailProvider {
  readonly name = 'sendgrid';

  isConfigured() {
    return Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
  }

  async send(input: NotificationPayload) {
    if (!this.isConfigured()) {
      throw new Error('SENDGRID_NOT_CONFIGURED');
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: input.toEmail, name: input.toName }],
            dynamic_template_data: input.templateData ?? undefined,
            subject: input.subject
          }
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL,
          name: process.env.SENDGRID_FROM_NAME ?? 'Tripmate'
        },
        subject: input.subject,
        template_id: input.dynamicTemplateId,
        content: input.dynamicTemplateId
          ? undefined
          : [
              input.text ? { type: 'text/plain', value: input.text } : undefined,
              input.html ? { type: 'text/html', value: input.html } : undefined
            ].filter(Boolean)
      })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`SENDGRID_SEND_FAILED:${message}`);
    }

    return {
      providerMessageId: response.headers.get('x-message-id') ?? undefined
    };
  }
}

export const sendgridProvider = new SendGridProvider();
