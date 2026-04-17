import type { NotificationPayload } from '@/types/travel';
import { appUrl } from '@/lib/env';

const BRAND_BG = '#01696f';
const PAGE_BG = '#f7f6f2';
const TEXT = '#28251d';
const MUTED = '#7a7974';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDetailRows(details?: Record<string, string>) {
  if (!details) return '';
  const rows = Object.entries(details)
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #edeae5;color:${MUTED};font-size:13px;">${escapeHtml(k)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #edeae5;color:${TEXT};font-weight:600;font-size:13px;text-align:right;">${escapeHtml(v)}</td>
        </tr>`
    )
    .join('');
  return `<table width="100%" style="margin-top:16px;border-collapse:collapse;">${rows}</table>`;
}

function renderCta(data: NotificationPayload['templateData']) {
  if (!data?.ctaUrl || !data?.ctaLabel) return '';
  return `
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(data.ctaUrl)}" style="display:inline-block;background:${BRAND_BG};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        ${escapeHtml(data.ctaLabel)}
      </a>
    </p>`;
}

function shell(title: string, bodyHtml: string) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${PAGE_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${TEXT};">
    <table width="100%" style="background:${PAGE_BG};padding:40px 16px;">
      <tr><td align="center">
        <table width="560" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr><td style="background:${BRAND_BG};padding:24px 28px;color:#ffffff;font-size:18px;font-weight:600;">Tripmate</td></tr>
          <tr><td style="padding:28px;font-size:15px;line-height:1.55;color:${TEXT};">
            ${bodyHtml}
          </td></tr>
          <tr><td style="background:${PAGE_BG};padding:18px 28px;font-size:12px;color:${MUTED};text-align:center;">
            Tripmate · <a href="${escapeHtml(appUrl())}" style="color:${MUTED};">${escapeHtml(appUrl())}</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderEmail(payload: NotificationPayload): { html: string; text: string } {
  const data = payload.templateData ?? {};
  const message = typeof data.message === 'string' ? data.message : '';
  const details = (data.details as Record<string, string> | undefined) ?? undefined;
  const kind = typeof data.kind === 'string' ? data.kind : 'generic';

  const headline = kind === 'share_invite' ? 'A trip itinerary was shared with you' : payload.subject;

  const bodyHtml = `
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">${escapeHtml(headline)}</h2>
    ${message ? `<p style="margin:0;">${escapeHtml(message)}</p>` : ''}
    ${renderDetailRows(details)}
    ${renderCta(data)}
  `;

  const text = [
    headline,
    '',
    message,
    '',
    ...(details ? Object.entries(details).map(([k, v]) => `${k}: ${v}`) : []),
    '',
    data.ctaUrl ? `${data.ctaLabel ?? 'Open'}: ${data.ctaUrl}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  return {
    html: shell(payload.subject, bodyHtml),
    text
  };
}
