import { bookingRepository } from '@/server/repositories/booking.repository';
import { tripRepository } from '@/server/repositories/trip.repository';
import { userRepository } from '@/server/repositories/user.repository';
import { MockBookingProvider } from '@/server/integrations/mock-booking-provider';
import { MockNotificationProvider } from '@/server/integrations/mock-notification-provider';
import { MockPaymentProvider } from '@/server/integrations/mock-payment-provider';

const bookingProvider = new MockBookingProvider();
const paymentProvider = new MockPaymentProvider();
const notificationProvider = new MockNotificationProvider();

export const bookingService = {
  async approveBooking(userId: string, tripId: string, paymentMethodId?: string) {
    const trip = await tripRepository.getTripByIdForUser(userId, tripId);
    if (!trip) throw new Error('Trip not found.');

    const request = trip.requests[0];
    if (!request) throw new Error('Trip request not found.');
    if (!request.selectedPackageId) throw new Error('Select a package before booking.');

    const existing = await bookingRepository.getBookingByRequestId(request.id);
    if (existing?.status === 'CONFIRMED') {
      return existing;
    }

    const pkg = request.packages.find((candidate) => candidate.id === request.selectedPackageId);
    if (!pkg) throw new Error('Selected package could not be found.');

    const profile = await userRepository.findById(userId);
    const travelerProfile = trip.requests[0]?.preferenceSnapshot;
    const defaultPaymentMethod = paymentMethodId
      ? { id: paymentMethodId }
      : await userRepository.ensureMockPaymentMethod(userId);

    const booking = existing
      ? existing
      : await bookingRepository.createPendingBooking({
          userId,
          tripId,
          tripRequestId: request.id,
          tripPackageId: pkg.id,
          paymentMethodId: defaultPaymentMethod.id,
          status: 'PENDING_PROVIDER_CONFIRMATION',
          totalPriceCents: pkg.totalPriceCents,
          currency: pkg.currency
        });

    await tripRepository.updateRequestStatus(request.id, 'BOOKING_PENDING');
    await tripRepository.updateTripStatus(trip.id, 'BOOKING_PENDING');

    const payment = await paymentProvider.authorize({
      userId,
      amountCents: pkg.totalPriceCents,
      currency: pkg.currency,
      paymentMethodId: defaultPaymentMethod.id,
      description: `Tripmate booking for ${trip.title}`
    });

    if (!payment.success) {
      await bookingRepository.confirmBooking({
        bookingId: booking.id,
        status: 'FAILED',
        items: []
      });
      await tripRepository.updateRequestStatus(request.id, 'FAILED');
      await tripRepository.updateTripStatus(trip.id, 'FAILED');
      throw new Error(payment.failureReason ?? 'Payment authorization failed.');
    }

    const providerResult = await bookingProvider.createBooking({
      tripId: trip.id,
      tripRequestId: request.id,
      packageId: pkg.id,
      travelerName: profile ? `${profile.firstName} ${profile.lastName}` : 'Tripmate Traveler',
      travelerEmail: profile?.email ?? 'traveler@example.com'
    });

    if (!providerResult.success) {
      await bookingRepository.confirmBooking({
        bookingId: booking.id,
        status: 'FAILED',
        items: []
      });
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
      cancellationDeadline: providerResult.cancellationDeadline ? new Date(providerResult.cancellationDeadline) : undefined,
      items: providerResult.items.map((item) => ({
        bookingId: booking.id,
        type: item.type,
        status: item.status,
        provider: item.provider,
        providerReference: item.providerReference,
        displayName: item.type === 'FLIGHT' ? `${pkg.flightOption.airline} · ${pkg.flightOption.flightNumber}` : `${pkg.hotelOption.name} · ${pkg.hotelOption.nights} nights`,
        amountCents: item.type === 'FLIGHT' ? flightAmount : hotelAmount,
        currency: pkg.currency,
        details: item.details
      }))
    });

    await tripRepository.updateRequestStatus(request.id, 'CONFIRMED');
    await tripRepository.updateTripStatus(trip.id, 'CONFIRMED');
    await tripRepository.createAgentMessages([
      {
        tripRequestId: request.id,
        role: 'ASSISTANT',
        type: 'STATUS',
        content: 'Your booking was confirmed successfully.'
      },
      {
        tripRequestId: request.id,
        role: 'ASSISTANT',
        type: 'SUMMARY',
        content: `Confirmation number ${providerResult.confirmationNumber} was issued and the itinerary is ready.`
      }
    ]);

    await tripRepository.createAuditLog({
      userId,
      tripId,
      bookingId: confirmed.id,
      actorType: 'SYSTEM',
      action: 'booking.confirmed',
      details: { confirmationNumber: providerResult.confirmationNumber }
    });

    await notificationProvider.send({
      to: profile?.email ?? 'traveler@example.com',
      subject: `Tripmate booking confirmed · ${trip.title}`,
      body: `Your Tripmate booking is confirmed. Reference: ${providerResult.confirmationNumber}.`
    });

    return confirmed;
  }
};
