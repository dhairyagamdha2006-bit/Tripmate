import { prisma } from '@/lib/db/prisma';
import type { Prisma, TripRequestStatus } from '@prisma/client';

export const tripRepository = {
  createTripWithRequest(args: {
    userId: string;
    title: string;
    originLabel: string;
    destinationLabel: string;
    departureDate: Date;
    returnDate: Date;
    travelerCount: number;
    request: {
      originCode: string;
      originCity: string;
      destinationCode: string;
      destinationCity: string;
      departureDate: Date;
      returnDate: Date;
      travelerCount: number;
      budgetCents: number;
      currency: string;
      cabinClass: Prisma.TripRequestCreateWithoutTripInput['cabinClass'];
      preferDirectFlights: boolean;
      hotelStarLevel: number;
      neighborhoodPreference?: string | null;
      amenities: string[];
      refundableOnly: boolean;
      notes?: string | null;
    };
    preferenceSnapshot?: Prisma.TripPreferenceSnapshotUncheckedCreateWithoutTripRequestInput;
  }) {
    return prisma.trip.create({
      data: {
        userId: args.userId,
        title: args.title,
        originLabel: args.originLabel,
        destinationLabel: args.destinationLabel,
        departureDate: args.departureDate,
        returnDate: args.returnDate,
        travelerCount: args.travelerCount,
        status: 'DRAFT',
        requests: {
          create: {
            userId: args.userId,
            originCode: args.request.originCode,
            originCity: args.request.originCity,
            destinationCode: args.request.destinationCode,
            destinationCity: args.request.destinationCity,
            departureDate: args.request.departureDate,
            returnDate: args.request.returnDate,
            travelerCount: args.request.travelerCount,
            budgetCents: args.request.budgetCents,
            currency: args.request.currency,
            cabinClass: args.request.cabinClass,
            preferDirectFlights: args.request.preferDirectFlights,
            hotelStarLevel: args.request.hotelStarLevel,
            neighborhoodPreference: args.request.neighborhoodPreference,
            amenities: args.request.amenities,
            refundableOnly: args.request.refundableOnly,
            notes: args.request.notes,
            status: 'DRAFT',
            preferenceSnapshot: args.preferenceSnapshot ? { create: args.preferenceSnapshot } : undefined,
            agentMessages: {
              create: {
                role: 'ASSISTANT',
                type: 'TEXT',
                content: `I'm ready to plan your trip to ${args.request.destinationCity}. I will search flights and hotels after you start planning.`
              }
            }
          }
        }
      },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          include: { preferenceSnapshot: true }
        }
      }
    });
  },

  listTripsByUserId(userId: string) {
    return prisma.trip.findMany({
      where: { userId },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: [{ departureDate: 'asc' }, { createdAt: 'desc' }]
    });
  },

  getAgentMessages(tripRequestId: string) {
  return prisma.agentMessage.findMany({
    where: { tripRequestId },
    orderBy: { createdAt: 'asc' },
    take: 50
  });
},

  getTripByIdForUser(userId: string, tripId: string) {
    return prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            preferenceSnapshot: true,
            flightOptions: { orderBy: { priceCents: 'asc' } },
            hotelOptions: { orderBy: { totalPriceCents: 'asc' } },
            packages: {
              include: {
                flightOption: true,
                hotelOption: true,
                booking: { include: { items: true } }
              },
              orderBy: [{ recommended: 'desc' }, { overallScore: 'desc' }]
            },
            agentMessages: { orderBy: { createdAt: 'asc' } },
            bookings: { include: { items: true } },
            searchSessions: { orderBy: { createdAt: 'asc' } }
          }
        },
        bookings: {
          include: { items: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  getLatestRequestByTripId(userId: string, tripId: string) {
    return prisma.tripRequest.findFirst({
      where: { tripId, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        preferenceSnapshot: true,
        flightOptions: true,
        hotelOptions: true,
        packages: {
          include: {
            flightOption: true,
            hotelOption: true
          },
          orderBy: [{ recommended: 'desc' }, { overallScore: 'desc' }]
        },
        bookings: true,
        agentMessages: { orderBy: { createdAt: 'asc' } }
      }
    });
  },

  updateTripStatus(tripId: string, status: TripRequestStatus) {
    return prisma.trip.update({ where: { id: tripId }, data: { status } });
  },

  updateRequestStatus(requestId: string, status: TripRequestStatus) {
    return prisma.tripRequest.update({ where: { id: requestId }, data: { status } });
  },

  setSelectedPackage(requestId: string, packageId: string, status: TripRequestStatus = 'PACKAGE_SELECTED') {
    return prisma.tripRequest.update({
      where: { id: requestId },
      data: {
        selectedPackageId: packageId,
        status
      }
    });
  },

  createAgentMessage(data: Prisma.AgentMessageUncheckedCreateInput) {
    return prisma.agentMessage.create({ data });
  },

  createAgentMessages(data: Prisma.AgentMessageUncheckedCreateInput[]) {
    return prisma.agentMessage.createMany({ data });
  },

  async replaceSearchResults(args: {
    requestId: string;
    flightOptions: Prisma.FlightOptionCacheUncheckedCreateInput[];
    hotelOptions: Prisma.HotelOptionCacheUncheckedCreateInput[];
    tripPackages: Prisma.TripPackageUncheckedCreateInput[];
    tripId: string;
    status?: TripRequestStatus;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.tripPackage.deleteMany({ where: { tripRequestId: args.requestId } });
      await tx.flightOptionCache.deleteMany({ where: { tripRequestId: args.requestId } });
      await tx.hotelOptionCache.deleteMany({ where: { tripRequestId: args.requestId } });

      if (args.flightOptions.length) {
        await tx.flightOptionCache.createMany({ data: args.flightOptions });
      }

      if (args.hotelOptions.length) {
        await tx.hotelOptionCache.createMany({ data: args.hotelOptions });
      }

      if (args.tripPackages.length) {
        await tx.tripPackage.createMany({ data: args.tripPackages });
      }

      if (args.status) {
        await tx.tripRequest.update({ where: { id: args.requestId }, data: { status: args.status } });
        await tx.trip.update({ where: { id: args.tripId }, data: { status: args.status } });
      }

      return tx.tripRequest.findUnique({
        where: { id: args.requestId },
        include: {
          packages: { include: { flightOption: true, hotelOption: true } }
        }
      });
    });
  },

  createAuditLog(data: Prisma.AuditLogUncheckedCreateInput) {
    return prisma.auditLog.create({ data });
  }
};
