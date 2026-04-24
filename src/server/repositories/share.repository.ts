import { ShareLinkStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const shareRepository = {
  create(input: {
    tripId: string;
    createdById: string;
    token: string;
    note?: string | null;
    expiresAt?: Date | null;
  }) {
    return prisma.itineraryShare.create({
      data: {
        tripId: input.tripId,
        createdById: input.createdById,
        token: input.token,
        note: input.note ?? undefined,
        expiresAt: input.expiresAt ?? undefined
      }
    });
  },

  listForTrip(tripId: string) {
    return prisma.itineraryShare.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' }
    });
  },

  revoke(shareId: string) {
    return prisma.itineraryShare.update({
      where: { id: shareId },
      data: {
        status: ShareLinkStatus.REVOKED,
        revokedAt: new Date()
      }
    });
  },

  findById(shareId: string) {
    return prisma.itineraryShare.findUnique({ where: { id: shareId } });
  },

  findPublicByToken(token: string) {
    return prisma.itineraryShare.findUnique({
      where: { token },
      include: {
        trip: {
          include: {
            bookings: {
              orderBy: { createdAt: 'desc' },
              include: { items: true }
            },
            requests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                packages: {
                  orderBy: { overallScore: 'desc' },
                  include: {
                    flightOption: true,
                    hotelOption: true
                  }
                }
              }
            }
          }
        }
      }
    });
  },

  touchViewed(id: string) {
    return prisma.itineraryShare.update({
      where: { id },
      data: { lastViewedAt: new Date() }
    });
  }
};
