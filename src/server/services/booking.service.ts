import { Prisma } from '@prisma/client';
import { bookingRepository } from '@/server/repositories/booking.repository';
import { tripRepository } from '@/server/repositories/trip.repository';
import { userRepository } from '@/server/repositories/user.repository';
import {
  createBookingProvider,
  createPaymentProvider,
  createNotificationProvider
} from '@/server/integrations/provider-factory';
import { getStripe, hasStripe } from '@/lib/stripe';
import { scheduleRemindersForBooking } from '@/server/services/reminder.service';
import { appUrl } from '@/lib/env';

/**
 * Booking service.
 *
 * Pipeline on approve:
 *   1. Load trip, request, selected package, payment method.
 *   2. Authorize payment via Stripe (PaymentIntent with manual capture).
 *      Store `paymentIntentId` and `paymentStatus` on the booking.
 *      On failure, refund nothing (no charge occurred) and mark FAILED.
 *   3. Call the booking provider.
 *      - If the provider returned a real confirmation, capture the intent
 *        and mark the booking CONFIRMED with fulfillmentMode=auto.
 *      - If the provider is a sandbox/mock or returned no provider
 *        reference, mark the booking PENDING_FULFILLMENT with
 *        fulfillmentMode=manual and *hold* the authorization so an
 *        operator can capture or void it during fulfilment.
 *   4. Schedule cancellation reminders.
 *   5. Send confirmation email (non-blocking).
 *
 * The key honesty rule: we never present a mock confirmation number as
 * if it were a real provider booking. PENDING_FULFILLMENT is the visible
 * state when we can't obtain a real PNR, and UI copy reflects that.
 */
export const bookingService = {
  async approveBooking(userId: string, tripId: string, paymentMethodId?: string) {
    const bookingProvider = createBookingProvider();
    const paymentProvider = createPaymentProvider();
    const notificationProvider = createNotificationProvider();

    const trip = await tripRepository.getTripByIdForUser(userId, tripId);
    if (!trip) throw new Error('Trip not found.');

    const request = trip.requests[0];
    if (!request) throw new Error('Trip request not found.');
    if (!request.selectedPackageId) throw new Error('Select a package before booking.');

    const existing = await bookingRepository.getBookingByRequestId(request.id);
    if (
      existing &&
      (existing.status === 'CONFIRMED' || existing.status === 'PENDING_FULFILLMENT')
    ) {
      return existing;
    }

    const pkg = request.packages.find((p) => p.id === request.selectedPackageId);
    if (!pkg) throw new Error('Selected package could not be found.');

    const profile = await userRepository.findById(userId);

    // Prefer the explicitly-supplied payment method; otherwise fall back
    // to the user's default.
    const paymentMethod = paymentMethodId
      ? await userRepository.getPaymentMethodForUser(userId, paymentMethodId)
      : await userRepository.getDefaultPaymentMethod(userId);

    if (!paymentMethod) {
      throw new Error('No payment method found. Please add a card before booking.');
    }

    const booking =
      existing ??
      (await bookingRepository.createPendingBooking({
        userId,
        tripId,
        tripRequestId: request.id,
        tripPackageId: pkg.id,
        paymentMethodId: paymentMethod.id,
        status: 'PENDING_APPROVAL',
        totalPriceCents: pkg.totalPriceCents,
        currency: pkg.currency
      }));

    await tripRepository.updateRequestStatus(request.id, 'PAYMENT_AUTHORIZED');
    await tripRepository.updateTripStatus(trip.id, 'PAYMENT_AUTHORIZED');

    // ── 1. Authorize payment ──────────────────────────────────────
    const payment = await paymentProvider.authorize({
      userId,
      amountCents: pkg.totalPriceCents,
      currency: pkg.currency,
      paymentMethodId: paymentMethod.id,
      description: `Tripmate booking for ${trip.title}`
    });

    if (!payment.success) {
      await bookingRepository.updateBooking(booking.id, {
        status: 'FAILED',
        paymentStatus: payment.status ?? 'failed'
      });
      await tripRepository.updateRequestStatus(request.id, 'FAILED');
      await tripRepository.updateTripStatus(trip.id, 'FAILED');
      throw new Error(payment.failureReason ?? 'Payment authorization failed.');
    }

    await bookingRepository.updateBooking(booking.id, {
      status: 'PAYMENT_AUTHORIZED',
      paymentIntentId: payment.providerReference,
      paymentStatus: payment.status ?? 'requires_capture',
      paymentAuthorizedAt: new Date()
    });

    await tripRepository.updateRequestStatus(request.id, 'BOOKING_PENDING');
    await tripRepository.updateTripStatus(trip.id, 'BOOKING_PENDING');

    // ── 2. Create booking with provider ──────────────────────────
    const providerResult = await bookingProvider.createBooking({
      tripId: trip.id,
      tripRequestId: request.id,
      packageId: pkg.id,
      travelerName: profile ? `${profile.firstName} ${profile.lastName}` : 'Tripmate Traveler',
      travelerEmail: profile?.email ?? 'traveler@example.com'
    });

    if (!providerResult.success) {
      // Provider refused — void the Stripe authorization so we don't
      // capture an unrecoverable charge.
      await voidStripeAuthorization(payment.providerReference);
      await bookingRepository.updateBooking(booking.id, {
        status: 'FAILED',
        paymentStatus: 'canceled'
      });
      await tripRepository.updateRequestStatus(request.id, 'FAILED');
      await tripRepository.updateTripStatus(trip.id, 'FAILED');
      throw new Error(providerResult.failureReason ?? 'Booking provider failed.');
    }

    const flightAmount = pkg.flightOption.priceCents * request.travelerCount;
    const hotelAmount = pkg.hotelOption.totalPriceCents;

    // ── 3. Decide the honest state ────────────────────────────────
    // Real providers (Amadeus production PNR, Duffel, Hotelbeds) set
    // `providerReference` to a real confirmation. The mock booking
    // provider returns a synthetic code. We treat mock / missing as
    // "manual fulfilment pending" and surface that status to the user.
    const providerIsReal = providerResult.items.every(
      (item) => !item.provider.startsWith('mock-') && !!item.providerReference
    );

    const finalStatus = providerIsReal ? 'CONFIRMED' : 'PENDING_FULFILLMENT';
    const fulfillmentMode: 'auto' | 'manual' = providerIsReal ? 'auto' : 'manual';

    const confirmed = await bookingRepository.confirmBooking({
      bookingId: booking.id,
      status: finalStatus,
      fulfillmentMode,
      confirmationNumber: providerIsReal ? providerResult.confirmationNumber : null,
      cancellationDeadline: providerResult.cancellationDeadline
        ? new Date(providerResult.cancellationDeadline)
        : undefined,
      items: providerResult.items.map((item) => ({
        bookingId: booking.id,
        type: item.type,
        status: providerIsReal ? item.status : 'PENDING_FULFILLMENT',
        provider: item.provider,
        providerReference: item.providerReference,
        displayName: item.displayName,
        amountCents: item.type === 'FLIGHT' ? flightAmount : hotelAmount,
        currency: pkg.currency,
        details: (item.details ?? {}) as Prisma.InputJsonValue
      }))
    });

    if (providerIsReal) {
      // Capture the authorization so the charge actually settles.
      await captureStripeAuthorization(payment.providerReference, booking.id);
      await bookingRepository.updateBooking(booking.id, {
        paymentStatus: 'succeeded',
        paymentCapturedAt: new Date()
      });
    }

    await tripRepository.updateRequestStatus(
      request.id,
      providerIsReal ? 'CONFIRMED' : 'PENDING_FULFILLMENT'
    );
    await tripRepository.updateTripStatus(
      trip.id,
      providerIsReal ? 'CONFIRMED' : 'PENDING_FULFILLMENT'
    );

    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'USER',
      action: providerIsReal ? 'booking.confirmed' : 'booking.pending_fulfillment',
      details: {
        bookingId: confirmed.id,
        confirmationNumber: confirmed.confirmationNumber,
        totalPriceCents: pkg.totalPriceCents,
        paymentIntentId: payment.providerReference,
        fulfillmentMode
      }
    });

    // ── 4. Schedule cancellation reminders ───────────────────────
    if (confirmed.cancellationDeadline) {
      await scheduleRemindersForBooking({
        bookingId: confirmed.id,
        cancellationDeadline: confirmed.cancellationDeadline,
        departureDate: trip.departureDate
      });
    }

    // ── 5. Confirmation email (non-blocking) ─────────────────────
    if (profile) {
      notificationProvider
        .send({
          toEmail: profile.email,
          toName: `${profile.firstName} ${profile.lastName}`,
          subject: providerIsReal
            ? `Your trip to ${trip.destinationLabel} is confirmed`
            : `We're finalising your trip to ${trip.destinationLabel}`,
          templateData: {
            kind: providerIsReal ? 'booking_confirmed' : 'booking_pending_fulfillment',
            message: providerIsReal
              ? `Hi ${profile.firstName}, your booking is confirmed. Here are your details:`
              : `Hi ${profile.firstName}, we've authorised your payment and are finalising this booking with our suppliers. You'll get a second email once the reservation is issued.`,
            details: {
              'Booking Reference': confirmed.confirmationNumber ?? 'Pending fulfilment',
              Trip: trip.title,
              Destination: trip.destinationLabel,
              Departure: trip.departureDate.toLocaleDateString('en-US', { dateStyle: 'long' }),
              Return: trip.returnDate.toLocaleDateString('en-US', { dateStyle: 'long' }),
              'Total Paid': `${(pkg.totalPriceCents / 100).toFixed(2)} ${pkg.currency}`
            },
            ctaUrl: `${appUrl()}/trips/${tripId}/success`,
            ctaLabel: 'View your itinerary'
          }
        })
        .catch((err) => console.error('[booking] Failed to send confirmation email:', err));
    }

    return confirmed;
  },

  // ── Cancellation ────────────────────────────────────────────────
  async cancelBooking(userId: string, tripId: string) {
    const notificationProvider = createNotificationProvider();

    const trip = await tripRepository.getTripByIdForUser(userId, tripId);
    if (!trip) throw new Error('Trip not found.');

    const booking = trip.bookings[0];
    if (!booking) throw new Error('No booking found for this trip.');

    if (booking.status === 'CANCELLED') {
      throw new Error('This booking is already cancelled.');
    }
    if (
      booking.status !== 'CONFIRMED' &&
      booking.status !== 'PENDING_FULFILLMENT'
    ) {
      throw new Error('Only confirmed or pending-fulfilment bookings can be cancelled.');
    }

    if (booking.cancellationDeadline && new Date() > booking.cancellationDeadline) {
      throw new Error(
        `The cancellation deadline was ${booking.cancellationDeadline.toLocaleDateString()}. This booking can no longer be cancelled.`
      );
    }

    // Refund or void the Stripe charge, depending on capture state.
    if (booking.paymentIntentId && hasStripe()) {
      try {
        const stripe = getStripe();
        const intent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
        if (intent.status === 'requires_capture') {
          await stripe.paymentIntents.cancel(booking.paymentIntentId);
        } else if (intent.status === 'succeeded') {
          await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
        }
      } catch (err) {
        // Never let a Stripe error block the cancellation record.
        console.error('[booking] Stripe cancel/refund failed:', err);
      }
    }

    await bookingRepository.updateBooking(booking.id, {
      status: 'CANCELLED',
      paymentStatus: 'cancelled'
    });
    await tripRepository.updateTripStatus(tripId, 'CANCELLED');
    await tripRepository.updateRequestStatus(trip.requests[0]!.id, 'CANCELLED');

    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'USER',
      action: 'booking.cancelled',
      details: { bookingId: booking.id }
    });

    const profile = await userRepository.findById(userId);
    if (profile) {
      notificationProvider
        .send({
          toEmail: profile.email,
          toName: `${profile.firstName} ${profile.lastName}`,
          subject: `Booking cancelled — ${trip.title}`,
          templateData: {
            kind: 'booking_cancelled',
            message: `Hi ${profile.firstName}, your booking has been cancelled.`,
            details: {
              'Booking Reference': booking.confirmationNumber ?? 'N/A',
              Trip: trip.title,
              Status: 'Cancelled'
            },
            ctaUrl: `${appUrl()}/trips`,
            ctaLabel: 'View my trips'
          }
        })
        .catch((err) => console.error('[booking] Failed to send cancellation email:', err));
    }

    return { cancelled: true };
  }
};

async function captureStripeAuthorization(intentId: string | undefined, bookingId: string) {
  if (!intentId || !hasStripe()) return;
  try {
    await getStripe().paymentIntents.capture(intentId);
  } catch (err) {
    console.error('[booking] Failed to capture Stripe intent', { bookingId, err });
  }
}

async function voidStripeAuthorization(intentId: string | undefined) {
  if (!intentId || !hasStripe()) return;
  try {
    await getStripe().paymentIntents.cancel(intentId);
  } catch (err) {
    console.error('[booking] Failed to void Stripe intent', err);
  }
}
