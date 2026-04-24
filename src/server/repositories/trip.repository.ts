import { PackageLabel, TripRequestStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { NormalizedFlightOffer, NormalizedHotelOffer } from '@/types/travel';

type PackageSeed = {
  label: PackageLabel;
  recommended: boolean;
  overallScore: number;
  priceFitScore: number;
  convenienceScore: number;
  travelDurationScore: number;
  hotelQualityScore: number;
  refundFlexibilityScore: number;
  preferenceMatchScore: number;
  explanation: string;
  highlights: string[];
  warnings: string[];
  totalPriceCents: number;
  currency: string;
  flightOptionCacheId: string;
  hotelOptionCacheId: string;
};

export const tripRepository = {
  createTripWithRequest(userId: string, input: {
    title: string;
    originCode: string;
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    departureDate: Date;
    returnDate: Date;
    travelerCount: number;
    budgetCents: number;
    currency: string;
    cabinClass: any;
    preferDirectFlights: boolean;
    hotelStarLevel: number;
    neighborhoodPreference?: string | null;
    amenities: string[];
    refundableOnly: boolean;
    notes?: string | null;
  }) {
    return prisma.trip.create({
      data: {
        userId,
        title: input.title,
        originLabel: `${input.originCity} (${input.originCode})`,
        destinationLabel: `${input.destinationCity} (${input.destinationCode})`,
        departureDate: input.departureDate,
        returnDate: input.returnDate,
        travelerCount: input.travelerCount,
        status: TripRequestStatus.DRAFT,
        requests: {
          create: {
            userId,
            originCode: input.originCode,
            originCity: input.originCity,
            destinationCode: input.destinationCode,
            destinationCity: input.destinationCity,
            departureDate: input.departureDate,
            returnDate: input.returnDate,
            travelerCount: input.travelerCount,
            budgetCents: input.budgetCents,
            currency: input.currency,
            cabinClass: input.cabinClass,
            preferDirectFlights: input.preferDirectFlights,
            hotelStarLevel: input.hotelStarLevel,
            neighborhoodPreference: input.neighborhoodPreference ?? undefined,
            amenities: input.amenities,
            refundableOnly: input.refundableOnly,
            notes: input.notes ?? undefined,
            status: TripRequestStatus.DRAFT
          }
        }
      },
      include: {
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  },

  listTripsForUser(userId: string) {
    return prisma.trip.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  },

  getTripForUser(tripId: string, userId: string) {
    return prisma.trip.findFirst({
      where: { id: tripId, userId },
      include: {
        user: {
          include: {
            travelerProfile: true,
            paymentMethods: {
              orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
            }
          }
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            preferenceSnapshot: true,
            searchSessions: {
              orderBy: { createdAt: 'desc' }
            },
            flightOptions: {
              orderBy: { priceCents: 'asc' }
            },
            hotelOptions: {
              orderBy: { totalPriceCents: 'asc' }
            },
            packages: {
              orderBy: [{ recommended: 'desc' }, { overallScore: 'desc' }],
              include: {
                flightOption: true,
                hotelOption: true,
                booking: true
              }
            },
            bookings: {
              orderBy: { createdAt: 'desc' },
              include: { items: true }
            },
            agentMessages: {
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        bookings: {
          orderBy: { createdAt: 'desc' },
          include: { items: true }
        },
        shares: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  },

  getLatestRequest(tripId: string, userId: string) {
    return prisma.tripRequest.findFirst({
      where: { tripId, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        trip: true,
        user: {
          include: {
            travelerProfile: true
          }
        },
        bookings: true,
        packages: {
          include: {
            flightOption: true,
            hotelOption: true
          }
        }
      }
    });
  },

  async setSearching(tripId: string, tripRequestId: string) {
    await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: { status: TripRequestStatus.SEARCHING }
      }),
      prisma.tripRequest.update({
        where: { id: tripRequestId },
        data: { status: TripRequestStatus.SEARCHING }
      })
    ]);
  },

  async clearSearchArtifacts(tripRequestId: string) {
    await prisma.$transaction([
      prisma.tripPackage.deleteMany({ where: { tripRequestId } }),
      prisma.flightOptionCache.deleteMany({ where: { tripRequestId } }),
      prisma.hotelOptionCache.deleteMany({ where: { tripRequestId } }),
      prisma.providerSearchSession.deleteMany({ where: { tripRequestId } }),
      prisma.tripRequest.update({
        where: { id: tripRequestId },
        data: { selectedPackageId: null, recommendationSummary: null }
      })
    ]);
  },

  createSearchSession(input: { tripRequestId: string; kind: 'FLIGHTS' | 'HOTELS'; provider: string; requestPayload?: Record<string, unknown> }) {
    return prisma.providerSearchSession.create({
      data: {
        tripRequestId: input.tripRequestId,
        kind: input.kind,
        provider: input.provider,
        status: 'RUNNING',
        startedAt: new Date(),
        requestPayload: input.requestPayload
      }
    });
  },

  completeSearchSession(id: string, input: { status: 'COMPLETED' | 'FAILED'; responsePayload?: Record<string, unknown> | null }) {
    return prisma.providerSearchSession.update({
      where: { id },
      data: {
        status: input.status,
        completedAt: new Date(),
        responsePayload: input.responsePayload ?? undefined
      }
    });
  },

  async storeSearchResults(input: {
    tripRequestId: string;
    flightSessionId: string;
    hotelSessionId: string;
    flights: NormalizedFlightOffer[];
    hotels: NormalizedHotelOffer[];
  }) {
    const createdFlights = await Promise.all(
      input.flights.map((flight) =>
        prisma.flightOptionCache.create({
          data: {
            tripRequestId: input.tripRequestId,
            providerSearchSessionId: input.flightSessionId,
            provider: flight.provider,
            providerOfferId: flight.providerOfferId,
            airline: flight.airline,
            airlineCode: flight.airlineCode,
            flightNumber: flight.flightNumber,
            originCode: flight.originCode,
            destinationCode: flight.destinationCode,
            departureTime: new Date(flight.departureTime),
            arrivalTime: new Date(flight.arrivalTime),
            durationMinutes: flight.durationMinutes,
            stops: flight.stops,
            stopDetails: flight.stopDetails,
            cabinClass: flight.cabinClass,
            priceCents: flight.priceCents,
            currency: flight.currency,
            refundable: flight.refundable,
            changeable: flight.changeable,
            baggageIncluded: flight.baggageIncluded,
            seatsAvailable: flight.seatsAvailable,
            loyaltyProgram: flight.loyaltyProgram,
            returnFlightNumber: flight.returnFlightNumber,
            returnDepartureTime: flight.returnDepartureTime ? new Date(flight.returnDepartureTime) : undefined,
            returnArrivalTime: flight.returnArrivalTime ? new Date(flight.returnArrivalTime) : undefined,
            returnDurationMinutes: flight.returnDurationMinutes,
            returnStops: flight.returnStops,
            offerJson: flight.offerJson,
            expiresAt: flight.expiresAt ? new Date(flight.expiresAt) : undefined
          }
        })
      )
    );

    const createdHotels = await Promise.all(
      input.hotels.map((hotel) =>
        prisma.hotelOptionCache.create({
          data: {
            tripRequestId: input.tripRequestId,
            providerSearchSessionId: input.hotelSessionId,
            provider: hotel.provider,
            providerHotelId: hotel.providerHotelId,
            providerOfferId: hotel.providerOfferId,
            name: hotel.name,
            chain: hotel.chain,
            stars: hotel.stars,
            neighborhood: hotel.neighborhood,
            city: hotel.city,
            countryCode: hotel.countryCode,
            address: hotel.address,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            pricePerNightCents: hotel.pricePerNightCents,
            totalPriceCents: hotel.totalPriceCents,
            nights: hotel.nights,
            currency: hotel.currency,
            rating: hotel.rating,
            reviewCount: hotel.reviewCount,
            amenities: hotel.amenities,
            refundable: hotel.refundable,
            cancellationDeadline: hotel.cancellationDeadline ? new Date(hotel.cancellationDeadline) : undefined,
            roomType: hotel.roomType,
            bedType: hotel.bedType,
            distanceToCenterKm: hotel.distanceToCenterKm,
            offerJson: hotel.offerJson,
            expiresAt: hotel.expiresAt ? new Date(hotel.expiresAt) : undefined
          }
        })
      )
    );

    return { flights: createdFlights, hotels: createdHotels };
  },

  async savePackages(tripRequestId: string, packages: PackageSeed[], recommendationSummary?: string | null) {
    await prisma.tripPackage.createMany({
      data: packages.map((pkg) => ({
        tripRequestId,
        flightOptionCacheId: pkg.flightOptionCacheId,
        hotelOptionCacheId: pkg.hotelOptionCacheId,
        label: pkg.label,
        recommended: pkg.recommended,
        overallScore: pkg.overallScore,
        priceFitScore: pkg.priceFitScore,
        convenienceScore: pkg.convenienceScore,
        travelDurationScore: pkg.travelDurationScore,
        hotelQualityScore: pkg.hotelQualityScore,
        refundFlexibilityScore: pkg.refundFlexibilityScore,
        preferenceMatchScore: pkg.preferenceMatchScore,
        explanation: pkg.explanation,
        highlights: pkg.highlights,
        warnings: pkg.warnings,
        totalPriceCents: pkg.totalPriceCents,
        currency: pkg.currency
      }))
    });

    await prisma.tripRequest.update({
      where: { id: tripRequestId },
      data: {
        recommendationSummary: recommendationSummary ?? undefined,
        status: TripRequestStatus.RECOMMENDATIONS_READY
      }
    });
  },

  setSelectedPackage(tripRequestId: string, packageId: string) {
    return prisma.tripRequest.update({
      where: { id: tripRequestId },
      data: {
        selectedPackageId: packageId,
        status: TripRequestStatus.PACKAGE_SELECTED
      }
    });
  },

  setRequestStatus(tripRequestId: string, status: TripRequestStatus, recommendationSummary?: string | null) {
    return prisma.tripRequest.update({
      where: { id: tripRequestId },
      data: {
        status,
        recommendationSummary: recommendationSummary ?? undefined
      }
    });
  },

  setTripStatus(tripId: string, status: TripRequestStatus) {
    return prisma.trip.update({
      where: { id: tripId },
      data: { status }
    });
  }
};
