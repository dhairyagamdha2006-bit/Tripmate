import { formatCurrency } from '@/lib/utils/money';
import { formatDateLong, formatDateTimeLong } from '@/lib/utils/date';

export function renderWelcomeEmail(input: { name: string }) {
  return {
    subject: 'Welcome to Tripmate',
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#020617;color:#e2e8f0">
        <h1 style="color:#fff;font-size:28px;margin-bottom:16px">Welcome to Tripmate, ${escapeHtml(input.name)}.</h1>
        <p style="line-height:1.7">Your account is ready. You can now search real flight offers, compare hotel options, save payment methods securely, and share itineraries.</p>
      </div>
    `,
    text: `Welcome to Tripmate, ${input.name}. Your account is ready.`
  };
}

export function renderBookingEmail(input: {
  travelerName: string;
  tripTitle: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  totalPriceCents: number;
  currency: string;
  statusLine: string;
  shareUrl?: string;
  cancellationDeadline?: Date | null;
}) {
  const total = formatCurrency(input.totalPriceCents, input.currency);
  const deadline = input.cancellationDeadline ? `<p style="line-height:1.7">Cancellation deadline: <strong>${formatDateTimeLong(input.cancellationDeadline)}</strong></p>` : '';
  const shareLine = input.shareUrl ? `<p style="line-height:1.7">Share this itinerary: <a href="${input.shareUrl}" style="color:#38bdf8">${input.shareUrl}</a></p>` : '';

  return {
    subject: `Your Tripmate booking update for ${input.tripTitle}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#020617;color:#e2e8f0">
        <h1 style="color:#fff;font-size:28px;margin-bottom:16px">Booking update for ${escapeHtml(input.tripTitle)}</h1>
        <p style="line-height:1.7">Hi ${escapeHtml(input.travelerName)},</p>
        <p style="line-height:1.7">${escapeHtml(input.statusLine)}</p>
        <div style="border:1px solid #1e293b;border-radius:18px;padding:20px;margin:24px 0;background:#0f172a">
          <p style="margin:0 0 8px"><strong>Destination:</strong> ${escapeHtml(input.destination)}</p>
          <p style="margin:0 0 8px"><strong>Dates:</strong> ${formatDateLong(input.departureDate)} - ${formatDateLong(input.returnDate)}</p>
          <p style="margin:0"><strong>Total:</strong> ${total}</p>
        </div>
        ${deadline}
        ${shareLine}
      </div>
    `,
    text: `${input.statusLine}\nTrip: ${input.tripTitle}\nDestination: ${input.destination}\nDates: ${formatDateLong(input.departureDate)} - ${formatDateLong(input.returnDate)}\nTotal: ${total}`
  };
}

export function renderReminderEmail(input: {
  travelerName: string;
  tripTitle: string;
  deadline: Date;
  shareUrl?: string;
}) {
  const shareLine = input.shareUrl ? `\nItinerary: ${input.shareUrl}` : '';
  return {
    subject: `Cancellation reminder for ${input.tripTitle}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#020617;color:#e2e8f0">
        <h1 style="color:#fff;font-size:28px;margin-bottom:16px">Cancellation reminder</h1>
        <p style="line-height:1.7">Hi ${escapeHtml(input.travelerName)},</p>
        <p style="line-height:1.7">A cancellation window for <strong>${escapeHtml(input.tripTitle)}</strong> closes on <strong>${formatDateTimeLong(input.deadline)}</strong>.</p>
        ${input.shareUrl ? `<p style="line-height:1.7"><a href="${input.shareUrl}" style="color:#38bdf8">Open itinerary</a></p>` : ''}
      </div>
    `,
    text: `A cancellation window for ${input.tripTitle} closes on ${formatDateTimeLong(input.deadline)}.${shareLine}`
  };
}

export function renderShareEmail(input: {
  senderName: string;
  tripTitle: string;
  shareUrl: string;
  note?: string;
}) {
  return {
    subject: `${input.senderName} shared a Tripmate itinerary with you`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;margin:0 auto;padding:32px;background:#020617;color:#e2e8f0">
        <h1 style="color:#fff;font-size:28px;margin-bottom:16px">Shared itinerary</h1>
        <p style="line-height:1.7"><strong>${escapeHtml(input.senderName)}</strong> shared <strong>${escapeHtml(input.tripTitle)}</strong> with you.</p>
        ${input.note ? `<p style="line-height:1.7">${escapeHtml(input.note)}</p>` : ''}
        <p style="line-height:1.7"><a href="${input.shareUrl}" style="color:#38bdf8">Open itinerary</a></p>
      </div>
    `,
    text: `${input.senderName} shared ${input.tripTitle} with you. Open: ${input.shareUrl}`
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
