import type { NotificationProvider } from './contracts';
import type { NotificationPayload } from '@/types/travel';

export class SendGridNotificationProvider implements NotificationProvider {
  name = 'sendgrid';

  async send(input: NotificationPayload): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error('SendGrid API key not configured.');

    const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@tripmate.app';
    const fromName = process.env.SENDGRID_FROM_NAME ?? 'Tripmate';

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        personalizations: [
          {
            to: [{ email: input.toEmail, name: input.toName }],
            dynamic_template_ input.templateData ?? {}
          }
        ],
        subject: input.subject,
        content: [
          {
            type: 'text/html',
            value: buildEmailHtml(input)
          }
        ]
      })
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SendGrid send failed: ${res.status} — ${body}`);
    }
  }
}

function buildEmailHtml(input: NotificationPayload): string {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f7f6f2; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff;
               border-radius: 12px; overflow: hidden;
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #01696f; padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
    .body { padding: 32px; color: #28251d; font-size: 15px; line-height: 1.6; }
    .body h2 { font-size: 18px; margin: 0 0 12px; }
    .detail-row { display: flex; justify-content: space-between;
                  padding: 10px 0; border-bottom: 1px solid #edeae5; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #7a7974; }
    .value { font-weight: 600; }
    .cta { display: inline-block; margin-top: 24px; padding: 12px 28px;
           background: #01696f; color: #fff; border-radius: 8px;
           text-decoration: none; font-weight: 600; font-size: 14px; }
    .footer { background: #f7f6f2; padding: 20px 32px;
              font-size: 12px; color: #7a7974; text-align: center; }
  `;

  const data = input.templateData ?? {};

  let bodyContent = `<h2>${input.subject}</h2><p>${data.message ?? ''}</p>`;

  if (data.details && typeof data.details === 'object') {
    bodyContent += '<div>';
    for (const [k, v] of Object.entries(data.details)) {
      bodyContent += `<div class="detail-row">
        <span class="label">${k}</span>
        <span class="value">${v}</span>
      </div>`;
    }
    bodyContent += '</div>';
  }

  if (data.ctaUrl && data.ctaLabel) {
    bodyContent += `<a class="cta" href="${data.ctaUrl}">${data.ctaLabel}</a>`;
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${styles}</style></head>
<body>
  <div class="wrapper">
    <div class="header"><h1>✈ Tripmate</h1></div>
    <div class="body">${bodyContent}</div>
    <div class="footer">Tripmate · ${appUrl}<br>You received this because you have an account with us.</div>
  </div>
</body>
</html>`;
}
