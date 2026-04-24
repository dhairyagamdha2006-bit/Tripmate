import { ReminderType } from '@prisma/client';
import { addHours } from '@/lib/utils/date';
import { getBaseUrl } from '@/lib/utils/env';
import { reminderRepository } from '@/server/repositories/reminder.repository';
import { shareRepository } from '@/server/repositories/share.repository';
import { emailService } from '@/server/services/email.service';
import { renderReminderEmail } from '@/server/services/email-templates';

const REMINDER_OFFSETS_HOURS = [72, 24] as const;

export const reminderService = {
  async scheduleForBooking(booking: any) {
    if (!booking.cancellationDeadline) {
      return [];
    }

    const deadline = new Date(booking.cancellationDeadline);
    const jobs = [];
    for (const offset of REMINDER_OFFSETS_HOURS) {
      const scheduledFor = addHours(deadline, -offset);
      if (scheduledFor.getTime() <= Date.now()) {
        continue;
      }
      const type = offset === 72 ? ReminderType.CANCELLATION_72H : ReminderType.CANCELLATION_24H;
      jobs.push(
        await reminderRepository.createIfMissing({
          bookingId: booking.id,
          type,
          scheduledFor,
          idempotencyKey: `${booking.id}:${type}:${scheduledFor.toISOString()}`
        })
      );
    }
    return jobs;
  },

  async processDueReminders() {
    const jobs = await reminderRepository.claimDue();

    for (const job of jobs) {
      try {
        if (!job.booking.cancellationDeadline || ['CANCELLED', 'REFUNDED'].includes(job.booking.status)) {
          await reminderRepository.markSkipped(job.id, 'Booking no longer eligible for reminders.');
          continue;
        }

        const activeShare = await shareRepository.listForTrip(job.booking.tripId).then((shares) => shares.find((share) => share.status === 'ACTIVE'));
        const shareUrl = activeShare ? `${getBaseUrl()}/share/${activeShare.token}` : undefined;
        const template = renderReminderEmail({
          travelerName: job.booking.user.firstName ?? job.booking.user.name ?? 'traveler',
          tripTitle: job.booking.trip.title,
          deadline: new Date(job.booking.cancellationDeadline),
          shareUrl
        });

        await emailService.sendUserEmail({
          userId: job.booking.userId,
          bookingId: job.bookingId,
          tripId: job.booking.tripId,
          kind: 'CANCELLATION_REMINDER',
          toEmail: job.booking.user.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        });

        await reminderRepository.markSent(job.id);
      } catch (error) {
        await reminderRepository.markFailed(job.id, error instanceof Error ? error.message : 'Failed to process reminder.');
      }
    }

    return { processed: jobs.length };
  }
};
