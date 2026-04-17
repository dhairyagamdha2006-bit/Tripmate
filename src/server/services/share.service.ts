import { randomBytes } from 'node:crypto';

import { prisma } from '@/lib/db/prisma';
import { tripRepository } from '@/server/repositories/trip.repository';

/**
 * Share tokens: 32 random bytes, base64url-encoded. The token is
 * unguessable and the public route only resolves to the itinerary —
 * traveler PII (email, passport, payment method) is always stripped
 * before rendering.
 */
export function generateShareToken(): string {
  return randomBytes(32).toString('base64url');
}

export async function createShare(args: {
  userId: string;
  tripId: string;
  expiresInDays?: number;
}) {
  const trip = await tripRepository.getTripByIdForUser(args.userId, args.tripId);
  if (!trip) throw new Error('Trip not found.');

  const token = generateShareToken();
  const expiresAt = args.expiresInDays
    ? new Date(Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const share = await prisma.itineraryShare.create({
    data: {
      tripId: trip.id,
      token,
      createdById: args.userId,
      expiresAt
    }
  });

  await tripRepository.createAuditLog({
    userId: args.userId,
    tripId: trip.id,
    actorType: 'USER',
    action: 'trip.share_created',
    details: { shareId: share.id, expiresAt: expiresAt?.toISOString() ?? null }
  });

  return share;
}

export async function listSharesForTrip(userId: string, tripId: string) {
  const trip = await tripRepository.getTripByIdForUser(userId, tripId);
  if (!trip) return [];
  return prisma.itineraryShare.findMany({
    where: { tripId, revokedAt: null },
    orderBy: { createdAt: 'desc' }
  });
}

export async function revokeShare(args: {
  userId: string;
  tripId: string;
  shareId: string;
}) {
  const share = await prisma.itineraryShare.findFirst({
    where: { id: args.shareId, tripId: args.tripId }
  });
  if (!share) throw new Error('Share not found.');

  const trip = await tripRepository.getTripByIdForUser(args.userId, args.tripId);
  if (!trip) throw new Error('Trip not found.');

  await prisma.itineraryShare.update({
    where: { id: share.id },
    data: { revokedAt: new Date() }
  });

  await tripRepository.createAuditLog({
    userId: args.userId,
    tripId: args.tripId,
    actorType: 'USER',
    action: 'trip.share_revoked',
    details: { shareId: share.id }
  });
}

export type PublicShareView = {
  title: string;
  originLabel: string;
  destinationLabel: string;
  departureDate: string;
  returnDate: string;
  travelerCount: number;
  currency: string;
  totalPriceCents: number | null;
  confirmationStatus: string;
  flight: {
    airline: string;
    flightNumber: string;
    departureTime: string;
    arrivalTime: string;
    originCode: string;
    destinationCode: string;
    returnFlightNumber?: string | null;
    returnDepartureTime?: string | null;
    returnArrivalTime?: string | null;
  } | null;
  hotel: {
    name: string;
    stars: number;
    neighborhood?: string | null;
    city: string;
    nights: number;
    pricePerNightCents: number;
  } | null;
};

export async function getPublicShare(token: string): Promise<PublicShareView | null> {
  const share = await prisma.itineraryShare.findUnique({
    where: { token },
    include: {
      trip: {
        include: {
          requests: {
            orderBy: { createdAt: 'desc' },
            include: {
              packages: {
                where: { recommended: true },
                include: { flightOption: true, hotelOption: true },
                take: 1
              }
            },
            take: 1
          },
          bookings: {
            where: { status: { in: ['CONFIRMED', 'PENDING_FULFILLMENT'] } },
            include: {
              tripPackage: { include: { flightOption: true, hotelOption: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }
    }
  });

  if (!share) return null;
  if (share.revokedAt) return null;
  if (share.expiresAt && share.expiresAt < new Date()) return null;

  // Track view counts (fire-and-forget, failures don't affect display).
  await prisma.itineraryShare
    .update({
      where: { id: share.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date()
      }
    })
    .catch(() => undefined);

  const trip = share.trip;
  const booking = trip.bookings[0];
  const packageWithOptions = booking?.tripPackage ?? trip.requests[0]?.packages[0];
  const flight = packageWithOptions?.flightOption ?? null;
  const hotel = packageWithOptions?.hotelOption ?? null;

  return {
    title: trip.title,
    originLabel: trip.originLabel,
    destinationLabel: trip.destinationLabel,
    departureDate: trip.departureDate.toISOString(),
    returnDate: trip.returnDate.toISOString(),
    travelerCount: trip.travelerCount,
    currency: packageWithOptions?.currency ?? 'USD',
    totalPriceCents: packageWithOptions?.totalPriceCents ?? null,
    confirmationStatus: booking?.status ?? trip.status,
    flight: flight
      ? {
          airline: flight.airline,
          flightNumber: flight.flightNumber,
          departureTime: flight.departureTime.toISOString(),
          arrivalTime: flight.arrivalTime.toISOString(),
          originCode: flight.originCode,
          destinationCode: flight.destinationCode,
          returnFlightNumber: flight.returnFlightNumber ?? null,
          returnDepartureTime: flight.returnDepartureTime?.toISOString() ?? null,
          returnArrivalTime: flight.returnArrivalTime?.toISOString() ?? null
        }
      : null,
    hotel: hotel
      ? {
          name: hotel.name,
          stars: hotel.stars,
          neighborhood: hotel.neighborhood,
          city: hotel.city,
          nights: hotel.nights,
          pricePerNightCents: hotel.pricePerNightCents
        }
      : null
  };
}
