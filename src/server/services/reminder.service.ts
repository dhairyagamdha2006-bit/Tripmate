import { prisma } from '@/lib/db/prisma';
import type { ReminderKind } from '@prisma/client';
import { createNotificationProvider } from '@/server/integrations/provider-factory';
import { appUrl } from '@/lib/env';

/**
 * Booking reminders.
 *
 * We schedule a small, fixed set of reminders per booking and dedupe via
 * the `(bookingId, kind, offsetHours)` unique constraint. The cron endpoint
 * (`/api/cron/reminders`) picks up reminders whose `scheduledFor <= now`,
 * marks them SENT in the same transaction as the email dispatch, and
 * relies on Postgres to reject duplicates.
 */

const CANCELLATION_OFFSETS_HOURS = [72, 24];
const DEPARTURE_OFFSETS_HOURS = [72];

export async function scheduleRemindersForBooking(args: {
  bookingId: string;
  cancellationDeadline?: Date | null;
  departureDate: Date;
}) {
  const now = Date.now();
  const rows: Array<{
    bookingId: string;
    kind: ReminderKind;
    offsetHours: number;
    scheduledFor: Date;
  }> = [];

  if (args.cancellationDeadline) {
    for (const offsetHours of CANCELLATION_OFFSETS_HOURS) {
      const scheduledFor = new Date(args.cancellationDeadline.getTime() - offsetHours * 60 * 60 * 1000);
      if (scheduledFor.getTime() > now) {
        rows.push({
          bookingId: args.bookingId,
          kind: 'CANCELLATION_DEADLINE',
          offsetHours,
          scheduledFor
        });
      }
    }
  }

  for (const offsetHours of DEPARTURE_OFFSETS_HOURS) {
    const scheduledFor = new Date(args.departureDate.getTime() - offsetHours * 60 * 60 * 1000);
    if (scheduledFor.getTime() > now) {
      rows.push({
        bookingId: args.bookingId,
        kind: 'TRIP_DEPARTURE',
        offsetHours,
        scheduledFor
      });
    }
  }

  if (rows.length === 0) return;

  // `skipDuplicates` honours the `(bookingId, kind, offsetHours)` unique
  // constraint so re-calling this is idempotent.
  await prisma.bookingReminder.createMany({
    data: rows,
    skipDuplicates: true
  });
}

export async function dispatchDueReminders(limit = 50) {
  const now = new Date();
  const due = await prisma.bookingReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now }
    },
    orderBy: { scheduledFor: 'asc' },
    take: limit,
    include: {
      booking: {
        include: {
          trip: true,
          user: true
        }
      }
    }
  });

  const notifications = createNotificationProvider();
  const results = {
    considered: due.length,
    sent: 0,
    failed: 0,
    skipped: 0
  };

  for (const reminder of due) {
    // Transition PENDING -> SENT atomically so no other worker grabs it.
    const claimed = await prisma.bookingReminder.updateMany({
      where: { id: reminder.id, status: 'PENDING' },
      data: { status: 'SENT', sentAt: new Date() }
    });
    if (claimed.count === 0) {
      results.skipped += 1;
      continue;
    }

    const { booking } = reminder;
    if (!booking?.user) {
      await prisma.bookingReminder.update({
        where: { id: reminder.id },
        data: { status: 'SKIPPED', failureReason: 'missing booking or user' }
      });
      results.skipped += 1;
      continue;
    }

    try {
      await notifications.send({
        toEmail: booking.user.email,
        toName: `${booking.user.firstName} ${booking.user.lastName}`,
        subject:
          reminder.kind === 'CANCELLATION_DEADLINE'
            ? `Cancellation deadline approaching for ${booking.trip.title}`
            : `Your trip to ${booking.trip.destinationLabel} is coming up`,
        templateData: {
          kind:
            reminder.kind === 'CANCELLATION_DEADLINE'
              ? 'cancellation_reminder'
              : 'departure_reminder',
          message:
            reminder.kind === 'CANCELLATION_DEADLINE'
              ? `You can still cancel this trip without penalty until ${booking.cancellationDeadline?.toLocaleString() ?? 'the deadline'}.`
              : `Your trip to ${booking.trip.destinationLabel} departs on ${booking.trip.departureDate.toLocaleDateString()}. Have a great time.`,
          details: {
            Trip: booking.trip.title,
            'Booking Reference': booking.confirmationNumber ?? 'Pending fulfilment',
            'Cancellation Deadline':
              booking.cancellationDeadline?.toLocaleString() ?? 'Not applicable',
            Departure: booking.trip.departureDate.toLocaleDateString()
          },
          ctaUrl: `${appUrl()}/trips/${booking.tripId}`,
          ctaLabel: 'View trip'
        }
      });
      results.sent += 1;
    } catch (err) {
      await prisma.bookingReminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          failureReason: err instanceof Error ? err.message : String(err)
        }
      });
      results.failed += 1;
    }
  }

  return results;
}
