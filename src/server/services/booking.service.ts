import { bookingRepository } from '@/server/repositories/booking.repository';
import { tripRepository } from '@/server/repositories/trip.repository';
import { userRepository } from '@/server/repositories/user.repository';
import {
  createBookingProvider,
  createPaymentProvider,
  createNotificationProvider
} from '@/server/integrations/provider-factory';

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
    if (existing?.status === 'CONFIRMED') return existing;

    const pkg = request.packages.find((p) => p.id === request.selectedPackageId);
    if (!pkg) throw new Error('Selected package could not be found.');

    const profile = await userRepository.findById(userId);

    // Use provided payment method OR fetch the default one
    const paymentMethod = paymentMethodId
      ? await userRepository.getDefaultPaymentMethod(userId)
      : await userRepository.getDefaultPaymentMethod(userId);

    if (!paymentMethod) {
      throw new Error('No payment method found. Please add a payment method.');
    }

    const booking = existing ?? await bookingRepository.createPendingBooking({
      userId,
      tripId,
      tripRequestId: request.id,
      tripPackageId: pkg.id,
      paymentMethodId: paymentMethod.id,
      status: 'PENDING_PROVIDER_CONFIRMATION',
      totalPriceCents: pkg.totalPriceCents,
      currency: pkg.currency
    });

    await tripRepository.updateRequestStatus(request.id, 'BOOKING_PENDING');
    await tripRepository.updateTripStatus(trip.id, 'BOOKING_PENDING');

    // ── 1. Authorize payment ──────────────────────────────────────
    const payment = await paymentProvider.authorize({
      userId,
      amountCents: pkg.totalPriceCents,
      currency: pkg.currency,
      paymentMethodId: paymentMethod.id,
      description: `Tripmate booking for ${trip.title}`
    });

    if (!payment.success) {
      await bookingRepository.confirmBooking({ bookingId: booking.id, status: 'FAILED', items: [] });
      await tripRepository.updateRequestStatus(request.id, 'FAILED');
      await tripRepository.updateTripStatus(trip.id, 'FAILED');
      throw new Error(payment.failureReason ?? 'Payment authorization failed.');
    }

    // ── 2. Create booking with provider ──────────────────────────
    const providerResult = await bookingProvider.createBooking({
      tripId: trip.id,
      tripRequestId: request.id,
      packageId: pkg.id,
      travelerName: profile ? `${profile.firstName} ${profile.lastName}` : 'Tripmate Traveler',
      travelerEmail: profile?.email ?? 'traveler@example.com'
    });

    if (!providerResult.success) {
      await bookingRepository.confirmBooking({ bookingId: booking.id, status: 'FAILED', items: [] });
      await tripRepository.updateRequestStatus(request.id, 'FAILED');
      await tripRepository.updateTripStatus(trip.id, 'FAILED');
      throw new Error(providerResult.failureReason ?? 'Booking provider failed.');
    }

    const flightAmount = pkg.flightOption.priceCents * request.travelerCount;
    const hotelAmount = pkg.hotelOption.totalPriceCents;

    const confirmed = await bookingRepository.confirmBooking({
      bookingId: booking.id,
      status: 'CONFIRMED',
      confirmationNumber: providerResult.confirmationNumber,
      cancellationDeadline: providerResult.cancellationDeadline
        ? new Date(providerResult.cancellationDeadline)
        : undefined,
      items: providerResult.items.map((item) => ({
        bookingId: booking.id,
        type: item.type,
        status: item.status,
        provider: item.provider,
        providerReference: item.providerReference,
        displayName: item.displayName,
        amountCents: item.type === 'FLIGHT' ? flightAmount : hotelAmount,
        currency: pkg.currency,
        details: item.details ?? {}
      }))
    });

    await tripRepository.updateRequestStatus(request.id, 'CONFIRMED');
    await tripRepository.updateTripStatus(trip.id, 'CONFIRMED');

    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'USER',
      action: 'booking.confirmed',
      details: {
        bookingId: confirmed.id,
        confirmationNumber: confirmed.confirmationNumber,
        totalPriceCents: pkg.totalPriceCents,
        paymentReference: payment.providerReference
      }
    });

    // ── 3. Send confirmation email ────────────────────────────────
    if (profile) {
      await notificationProvider.send({
        toEmail: profile.email,
        toName: `${profile.firstName} ${profile.lastName}`,
        subject: `Your trip to ${trip.destinationLabel} is confirmed! 🎉`,
        templateData: {
          message: `Hi ${profile.firstName}, your booking is confirmed. Here are your details:`,
          details: {
            'Booking Reference': confirmed.confirmationNumber ?? 'Pending',
            'Trip': trip.title,
            'Destination': trip.destinationLabel,
            'Departure': trip.departureDate.toLocaleDateString('en-US', { dateStyle: 'long' }),
            'Return': trip.returnDate.toLocaleDateString('en-US', { dateStyle: 'long' }),
            'Total Paid': `$${(pkg.totalPriceCents / 100).toFixed(2)} ${pkg.currency}`
          },
          ctaUrl: `${process.env.APP_URL}/trips/${tripId}/success`,
          ctaLabel: 'View your itinerary'
        }
      }).catch((err) => {
        // Email failure must never fail the booking — log and continue
        console.error('[booking] Failed to send confirmation email:', err);
      });
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
    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be cancelled.');
    }

    // Check cancellation deadline
    if (booking.cancellationDeadline && new Date() > booking.cancellationDeadline) {
      throw new Error(
        `The cancellation deadline was ${booking.cancellationDeadline.toLocaleDateString()}. This booking can no longer be cancelled.`
      );
    }

    await bookingRepository.updateBookingStatus(booking.id, 'CANCELLED');
    await tripRepository.updateTripStatus(tripId, 'CANCELLED');
    await tripRepository.updateRequestStatus(trip.requests[0]!.id, 'CANCELLED');

    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'USER',
      action: 'booking.cancelled',
      details: { bookingId: booking.id }
    });

    // Send cancellation email
    const profile = await userRepository.findById(userId);
    if (profile) {
      await notificationProvider.send({
        toEmail: profile.email,
        toName: `${profile.firstName} ${profile.lastName}`,
        subject: `Booking cancelled — ${trip.title}`,
        templateData: {
          message: `Hi ${profile.firstName}, your booking has been cancelled.`,
          details: {
            'Booking Reference': booking.confirmationNumber ?? 'N/A',
            'Trip': trip.title,
            'Status': 'Cancelled'
          },
          ctaUrl: `${process.env.APP_URL}/trips`,
          ctaLabel: 'View my trips'
        }
      }).catch((err) => {
        console.error('[booking] Failed to send cancellation email:', err);
      });
    }

    return { cancelled: true };
  }
};
