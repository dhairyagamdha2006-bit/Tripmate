import { prisma } from '@/lib/db/prisma';
import type { BookingStatus, Prisma } from '@prisma/client';

export const bookingRepository = {
  getBookingByTripId(userId: string, tripId: string) {
    return prisma.booking.findFirst({
      where: { userId, tripId },
      include: { items: true, tripPackage: { include: { flightOption: true, hotelOption: true } } },
      orderBy: { createdAt: 'desc' }
    });
  },

  updateBookingStatus(bookingId: string, status: BookingStatus) {
  return prisma.booking.update({
    where: { id: bookingId },
     { status, updatedAt: new Date() }
  });
},


  getBookingByRequestId(tripRequestId: string) {
    return prisma.booking.findUnique({
      where: { tripRequestId },
      include: { items: true, tripPackage: { include: { flightOption: true, hotelOption: true } } }
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
          bookedAt: args.status === 'CONFIRMED' ? new Date() : undefined
        },
        include: { items: true }
      });
    });
  }
};
