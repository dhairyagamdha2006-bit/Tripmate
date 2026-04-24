import { BookingStatus, FulfillmentStatus, PaymentStatus, TripRequestStatus } from '@prisma/client';
import { getBaseUrl } from '@/lib/utils/env';
import { afterPaymentSchema, createPaymentIntentSchema } from '@/lib/validations/payment';
import { bookingRepository } from '@/server/repositories/booking.repository';
import { paymentMethodRepository } from '@/server/repositories/payment-method.repository';
import { tripRepository } from '@/server/repositories/trip.repository';
import { auditRepository } from '@/server/repositories/audit.repository';
import { stripeProvider } from '@/server/integrations/stripe-provider';
import { emailService } from '@/server/services/email.service';
import { reminderService } from '@/server/services/reminder.service';
import { renderBookingEmail } from '@/server/services/email-templates';

function paymentStateFromIntent(status: string): { paymentStatus: PaymentStatus; bookingStatus: BookingStatus } {
  switch (status) {
    case 'requires_payment_method':
      return { paymentStatus: PaymentStatus.REQUIRES_PAYMENT_METHOD, bookingStatus: BookingStatus.PAYMENT_PENDING };
    case 'requires_action':
      return { paymentStatus: PaymentStatus.REQUIRES_ACTION, bookingStatus: BookingStatus.PAYMENT_REQUIRES_ACTION };
    case 'processing':
      return { paymentStatus: PaymentStatus.PROCESSING, bookingStatus: BookingStatus.PAYMENT_PENDING };
    case 'succeeded':
      return { paymentStatus: PaymentStatus.CAPTURED, bookingStatus: BookingStatus.BOOKING_REQUESTED };
    case 'requires_capture':
      return { paymentStatus: PaymentStatus.AUTHORIZED, bookingStatus: BookingStatus.PAYMENT_AUTHORIZED };
    case 'canceled':
      return { paymentStatus: PaymentStatus.CANCELED, bookingStatus: BookingStatus.CANCELLED };
    default:
      return { paymentStatus: PaymentStatus.FAILED, bookingStatus: BookingStatus.FAILED };
  }
}

async function sendBookingStatusEmail(booking: any, statusLine: string) {
  const activeShare = booking.trip.shares?.find((share: any) => share.status === 'ACTIVE');
  const shareUrl = activeShare ? `${getBaseUrl()}/share/${activeShare.token}` : undefined;
  const template = renderBookingEmail({
    travelerName: booking.user.firstName ?? booking.user.name ?? 'traveler',
    tripTitle: booking.trip.title,
    destination: booking.trip.destinationLabel,
    departureDate: booking.trip.departureDate,
    returnDate: booking.trip.returnDate,
    totalPriceCents: booking.totalPriceCents,
    currency: booking.currency,
    statusLine,
    shareUrl,
    cancellationDeadline: booking.cancellationDeadline
  });

  if (booking.user.email) {
    await emailService.safeSendUserEmail({
      kind: 'BOOKING_CONFIRMATION',
      userId: booking.userId,
      bookingId: booking.id,
      tripId: booking.tripId,
      toEmail: booking.user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }
}

export const bookingService = {
  async selectPackage(userId: string, tripId: string, packageId: string) {
    const trip = await tripRepository.getTripForUser(tripId, userId);
    if (!trip) {
      throw new Error('TRIP_NOT_FOUND');
    }

    const request = trip.requests[0];
    const selectedPackage = request?.packages.find((pkg) => pkg.id === packageId);
    if (!request || !selectedPackage) {
      throw new Error('PACKAGE_NOT_FOUND');
    }

    await tripRepository.setSelectedPackage(request.id, packageId);
    await tripRepository.setTripStatus(tripId, TripRequestStatus.PACKAGE_SELECTED);

    const booking = await bookingRepository.upsertFromPackage({
      userId,
      tripId,
      tripRequestId: request.id,
      tripPackageId: selectedPackage.id,
      totalPriceCents: selectedPackage.totalPriceCents,
      currency: selectedPackage.currency,
      cancellationDeadline: selectedPackage.hotelOption.cancellationDeadline,
      flightDisplayName: `${selectedPackage.flightOption.airline} ${selectedPackage.flightOption.flightNumber}`,
      flightAmountCents: selectedPackage.flightOption.priceCents,
      flightProvider: selectedPackage.flightOption.provider,
      flightProviderRef: selectedPackage.flightOption.providerOfferId,
      hotelDisplayName: selectedPackage.hotelOption.name,
      hotelAmountCents: selectedPackage.hotelOption.totalPriceCents,
      hotelProvider: selectedPackage.hotelOption.provider,
      hotelProviderRef: selectedPackage.hotelOption.providerOfferId
    });

    await auditRepository.log({
      actorType: 'USER',
      action: 'booking.package.selected',
      userId,
      tripId,
      bookingId: booking.id,
      details: { packageId }
    });

    return bookingRepository.findByIdForUser(booking.id, userId);
  },

  async createPaymentIntent(userId: string, bookingId: string, payload: unknown) {
    const parsed = createPaymentIntentSchema.parse(payload);
    const booking = await bookingRepository.findByIdForUser(bookingId, userId);
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const paymentMethod = await paymentMethodRepository.findByIdForUser(parsed.paymentMethodId, userId);
    if (!paymentMethod?.providerCustomerId || !paymentMethod.providerPaymentMethodId) {
      throw new Error('PAYMENT_METHOD_NOT_FOUND');
    }

    const paymentIntent = await stripeProvider.createPaymentIntent({
      amount: booking.totalPriceCents,
      currency: booking.currency,
      customerId: paymentMethod.providerCustomerId,
      paymentMethodId: paymentMethod.providerPaymentMethodId,
      description: `Tripmate booking for ${booking.trip.title}`,
      metadata: {
        bookingId: booking.id,
        tripId: booking.tripId,
        userId: booking.userId,
        tripRequestId: booking.tripRequestId
      }
    });

    const state = paymentStateFromIntent(paymentIntent.status);
    await bookingRepository.attachPaymentIntent(booking.id, {
      paymentIntentId: paymentIntent.id,
      paymentMethodId: paymentMethod.id,
      stripeCustomerId: paymentMethod.providerCustomerId,
      paymentStatus: state.paymentStatus,
      status: state.bookingStatus
    });

    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
      await this.handleSuccessfulPaymentIntent(paymentIntent.id);
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    };
  },

  async syncAfterPayment(userId: string, bookingId: string, payload: unknown) {
    const parsed = afterPaymentSchema.parse(payload);
    const booking = await bookingRepository.findByIdForUser(bookingId, userId);
    if (!booking || booking.paymentIntentId !== parsed.paymentIntentId) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    const paymentIntent = await stripeProvider.retrievePaymentIntent(parsed.paymentIntentId);
    const state = paymentStateFromIntent(paymentIntent.status);
    await bookingRepository.updateStatus(bookingId, {
      paymentStatus: state.paymentStatus,
      status: state.bookingStatus
    });

    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
      await this.handleSuccessfulPaymentIntent(paymentIntent.id);
    }

    return bookingRepository.findByIdForUser(bookingId, userId);
  },

  async handleSuccessfulPaymentIntent(paymentIntentId: string) {
    const booking = await bookingRepository.findByPaymentIntentId(paymentIntentId);
    if (!booking) {
      return null;
    }

    if (booking.fulfillmentStatus === FulfillmentStatus.PENDING_MANUAL || booking.fulfillmentStatus === FulfillmentStatus.CONFIRMED) {
      return booking;
    }

    const paymentIntent = await stripeProvider.retrievePaymentIntent(paymentIntentId);
    const state = paymentStateFromIntent(paymentIntent.status);

    const updated = await bookingRepository.updateStatus(booking.id, {
      paymentStatus: state.paymentStatus,
      status: state.bookingStatus,
      bookedAt: new Date()
    });

    const finalized = await bookingRepository.updateStatus(booking.id, {
      fulfillmentStatus: FulfillmentStatus.PENDING_MANUAL,
      status: BookingStatus.PENDING_MANUAL_FULFILLMENT,
      providerBookingState: 'pending-manual-fulfillment',
      providerMetadata: {
        reason: 'Tripmate collected payment and assembled a real quote, but provider-side ticketing or package issuance for the selected bundle still needs manual fulfillment or provider approval.',
        paymentIntentId
      },
      items: {
        updateMany: {
          where: {},
          data: {
            status: 'PENDING_MANUAL_FULFILLMENT'
          }
        }
      }
    });

    await tripRepository.setRequestStatus(booking.tripRequestId, TripRequestStatus.BOOKING_PENDING);
    await tripRepository.setTripStatus(booking.tripId, TripRequestStatus.BOOKING_PENDING);

    const hydrated = await bookingRepository.findById(booking.id);
    if (hydrated) {
      await reminderService.scheduleForBooking(hydrated);
      await sendBookingStatusEmail(
        hydrated,
        'Your payment was received and your booking request has been submitted. Final provider fulfillment is still pending manual confirmation, so Tripmate will keep the status honest in your itinerary.'
      );
    }

    await auditRepository.log({
      actorType: 'WEBHOOK',
      action: 'booking.payment.succeeded',
      userId: booking.userId,
      tripId: booking.tripId,
      bookingId: booking.id,
      details: {
        paymentIntentId,
        bookingStatus: finalized.status,
        paymentStatus: updated.paymentStatus
      }
    });

    return hydrated;
  },

  async handlePaymentFailed(paymentIntentId: string, reason?: string) {
    const booking = await bookingRepository.findByPaymentIntentId(paymentIntentId);
    if (!booking) {
      return null;
    }

    await bookingRepository.updateStatus(booking.id, {
      status: BookingStatus.FAILED,
      paymentStatus: PaymentStatus.FAILED,
      providerBookingState: reason ?? 'payment-failed'
    });
    await tripRepository.setRequestStatus(booking.tripRequestId, TripRequestStatus.FAILED, reason ?? 'Payment failed.');
    await tripRepository.setTripStatus(booking.tripId, TripRequestStatus.FAILED);

    return bookingRepository.findById(booking.id);
  }
};
