import { prisma } from '@/lib/db/prisma';
import type { BookingStatus, Prisma } from '@prisma/client';

export const bookingRepository = {
  getBookingByTripId(userId: string, tripId: string) {
    return prisma.booking.findFirst({
      where: { userId, tripId },
      include: {
        items: true,
        tripPackage: { include: { flightOption: true, hotelOption: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  updateBookingStatus(bookingId: string, status: BookingStatus) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status }
    });
  },

  updateBooking(bookingId: string, data: Prisma.BookingUncheckedUpdateInput) {
    return prisma.booking.update({ where: { id: bookingId }, data });
  },

  findByPaymentIntentId(paymentIntentId: string) {
    return prisma.booking.findUnique({
      where: { paymentIntentId },
      include: {
        items: true,
        trip: true,
        user: true,
        tripRequest: true,
        tripPackage: { include: { flightOption: true, hotelOption: true } }
      }
    });
  },

  getBookingByRequestId(tripRequestId: string) {
    return prisma.booking.findUnique({
      where: { tripRequestId },
      include: {
        items: true,
        tripPackage: { include: { flightOption: true, hotelOption: true } }
      }
    });
  },

  createPendingBooking(data: Prisma.BookingUncheckedCreateInput) {
    return prisma.booking.create({ data });
  },

  confirmBooking(args: {
    bookingId: string;
    status: BookingStatus;
    confirmationNumber?: string | null;
    cancellationDeadline?: Date | null;
    fulfillmentMode?: 'auto' | 'manual';
    items: Prisma.BookingItemUncheckedCreateInput[];
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.bookingItem.deleteMany({ where: { bookingId: args.bookingId } });
      if (args.items.length) {
        await tx.bookingItem.createMany({ data: args.items });
      }

      return tx.booking.update({
        where: { id: args.bookingId },
        data: {
          status: args.status,
          confirmationNumber: args.confirmationNumber,
          cancellationDeadline: args.cancellationDeadline,
          fulfillmentMode: args.fulfillmentMode,
          bookedAt:
            args.status === 'CONFIRMED' || args.status === 'PENDING_FULFILLMENT'
              ? new Date()
              : undefined
        },
        include: { items: true }
      });
    });
  }
};
