import { BookingStatus, FulfillmentStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const bookingRepository = {
  findById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        trip: {
          include: { shares: true }
        },
        tripRequest: true,
        tripPackage: {
          include: {
            flightOption: true,
            hotelOption: true
          }
        },
        paymentMethod: true,
        items: true
      }
    });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.booking.findFirst({
      where: { id, userId },
      include: {
        user: true,
        trip: {
          include: { shares: true }
        },
        tripRequest: true,
        tripPackage: {
          include: {
            flightOption: true,
            hotelOption: true
          }
        },
        paymentMethod: true,
        items: true
      }
    });
  },

  findByPaymentIntentId(paymentIntentId: string) {
    return prisma.booking.findUnique({
      where: { paymentIntentId },
      include: {
        user: true,
        trip: {
          include: { shares: true }
        },
        tripRequest: true,
        tripPackage: {
          include: {
            flightOption: true,
            hotelOption: true
          }
        },
        paymentMethod: true,
        items: true
      }
    });
  },

  findByTripRequestId(tripRequestId: string) {
    return prisma.booking.findUnique({
      where: { tripRequestId },
      include: {
        items: true,
        tripPackage: {
          include: {
            flightOption: true,
            hotelOption: true
          }
        },
        trip: {
          include: { shares: true }
        },
        user: true,
        tripRequest: true,
        paymentMethod: true
      }
    });
  },

  async upsertFromPackage(input: {
    userId: string;
    tripId: string;
    tripRequestId: string;
    tripPackageId: string;
    totalPriceCents: number;
    currency: string;
    cancellationDeadline?: Date | null;
    flightDisplayName: string;
    flightAmountCents: number;
    flightProvider: string;
    flightProviderRef?: string | null;
    hotelDisplayName: string;
    hotelAmountCents: number;
    hotelProvider: string;
    hotelProviderRef?: string | null;
  }) {
    const itemCreateData = [
      {
        type: 'FLIGHT' as const,
        status: 'QUOTED' as const,
        provider: input.flightProvider,
        providerReference: input.flightProviderRef ?? undefined,
        displayName: input.flightDisplayName,
        amountCents: input.flightAmountCents,
        currency: input.currency,
        cancellationDeadline: input.cancellationDeadline ?? undefined
      },
      {
        type: 'HOTEL' as const,
        status: 'QUOTED' as const,
        provider: input.hotelProvider,
        providerReference: input.hotelProviderRef ?? undefined,
        displayName: input.hotelDisplayName,
        amountCents: input.hotelAmountCents,
        currency: input.currency,
        cancellationDeadline: input.cancellationDeadline ?? undefined
      }
    ];

    return prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({ where: { tripRequestId: input.tripRequestId } });

      if (existing) {
        await tx.bookingItem.deleteMany({ where: { bookingId: existing.id } });
        return tx.booking.update({
          where: { id: existing.id },
          data: {
            tripPackageId: input.tripPackageId,
            totalPriceCents: input.totalPriceCents,
            currency: input.currency,
            cancellationDeadline: input.cancellationDeadline ?? undefined,
            status: BookingStatus.SELECTED,
            paymentStatus: PaymentStatus.NOT_STARTED,
            fulfillmentStatus: FulfillmentStatus.NOT_STARTED,
            paymentIntentId: null,
            paymentMethodId: null,
            stripeCustomerId: null,
            bookedAt: null,
            providerBookingReference: null,
            providerBookingState: null,
            providerMetadata: null,
            items: {
              create: itemCreateData
            }
          },
          include: { items: true }
        });
      }

      return tx.booking.create({
        data: {
          userId: input.userId,
          tripId: input.tripId,
          tripRequestId: input.tripRequestId,
          tripPackageId: input.tripPackageId,
          totalPriceCents: input.totalPriceCents,
          currency: input.currency,
          cancellationDeadline: input.cancellationDeadline ?? undefined,
          status: BookingStatus.SELECTED,
          paymentStatus: PaymentStatus.NOT_STARTED,
          fulfillmentStatus: FulfillmentStatus.NOT_STARTED,
          items: {
            create: itemCreateData
          }
        },
        include: { items: true }
      });
    });
  },

  attachPaymentIntent(bookingId: string, input: {
    paymentIntentId: string;
    paymentMethodId: string;
    stripeCustomerId: string;
    paymentStatus: PaymentStatus;
    status: BookingStatus;
  }) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentIntentId: input.paymentIntentId,
        paymentMethodId: input.paymentMethodId,
        stripeCustomerId: input.stripeCustomerId,
        paymentStatus: input.paymentStatus,
        status: input.status
      }
    });
  },

  updateStatus(bookingId: string, data: Prisma.BookingUpdateInput) {
    return prisma.booking.update({
      where: { id: bookingId },
      data
    });
  },

  listByUser(userId: string) {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { trip: true, items: true }
    });
  }
};
