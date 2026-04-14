import { Prisma } from '@prisma/client';
import { createFlightProvider, createHotelProvider } from '@/server/integrations/provider-factory';

const flightProvider = createFlightProvider();
const hotelProvider = createHotelProvider();

import { recommendationService } from '@/server/services/recommendation.service';
import { searchSessionRepository } from '@/server/repositories/search-session.repository';
import { tripRepository } from '@/server/repositories/trip.repository';

const flightProvider = new MockFlightProvider();
const hotelProvider = new MockHotelProvider();

export const searchService = {
  async runSearch(userId: string, tripId: string) {
    const request = await tripRepository.getLatestRequestByTripId(userId, tripId);
    if (!request) {
      throw new Error('Trip request not found.');
    }

    await tripRepository.updateTripStatus(tripId, 'SEARCHING');
    await tripRepository.updateRequestStatus(request.id, 'SEARCHING');
    await tripRepository.createAgentMessage({
      tripRequestId: request.id,
      role: 'ASSISTANT',
      type: 'STATUS',
      content: 'Searching flights and hotels now.'
    });

    const flightSession = await searchSessionRepository.create({
      tripRequestId: request.id,
      kind: 'FLIGHTS',
      provider: flightProvider.name,
      requestPayload: {
        originCode: request.originCode,
        destinationCode: request.destinationCode,
        departureDate: request.departureDate.toISOString(),
        returnDate: request.returnDate.toISOString()
      }
    });

    const hotelSession = await searchSessionRepository.create({
      tripRequestId: request.id,
      kind: 'HOTELS',
      provider: hotelProvider.name,
      requestPayload: {
        destinationCity: request.destinationCity,
        departureDate: request.departureDate.toISOString(),
        returnDate: request.returnDate.toISOString()
      }
    });

    const [flightOffers, hotelOffers] = await Promise.all([
      flightProvider.searchFlights({
        originCode: request.originCode,
        destinationCode: request.destinationCode,
        departureDate: request.departureDate.toISOString(),
        returnDate: request.returnDate.toISOString(),
        travelerCount: request.travelerCount,
        cabinClass: request.cabinClass,
        preferDirectFlights: request.preferDirectFlights,
        refundableOnly: request.refundableOnly,
        currency: request.currency
      }),
      hotelProvider.searchHotels({
        destinationCity: request.destinationCity,
        destinationCode: request.destinationCode,
        checkInDate: request.departureDate.toISOString(),
        checkOutDate: request.returnDate.toISOString(),
        travelerCount: request.travelerCount,
        minStars: request.hotelStarLevel,
        neighborhoodPreference: request.neighborhoodPreference,
        amenities: request.amenities,
        refundableOnly: request.refundableOnly,
        currency: request.currency
      })
    ]);

    await searchSessionRepository.updateStatus(
  flightSession.id,
  'COMPLETED',
  flightOffers as unknown as Prisma.InputJsonValue
);

await searchSessionRepository.updateStatus(
  hotelSession.id,
  'COMPLETED',
  hotelOffers as unknown as Prisma.InputJsonValue
);

    const flightOptionRows = flightOffers.map((offer) => ({
      tripRequestId: request.id,
      providerSearchSessionId: flightSession.id,
      provider: offer.provider,
      providerOfferId: offer.providerOfferId,
      airline: offer.airline,
      airlineCode: offer.airlineCode,
      flightNumber: offer.flightNumber,
      originCode: offer.originCode,
      destinationCode: offer.destinationCode,
      departureTime: new Date(offer.departureTime),
      arrivalTime: new Date(offer.arrivalTime),
      durationMinutes: offer.durationMinutes,
      stops: offer.stops,
      stopDetails: offer.stopDetails,
      cabinClass: offer.cabinClass,
      priceCents: offer.priceCents,
      currency: offer.currency,
      refundable: offer.refundable,
      changeable: offer.changeable,
      baggageIncluded: offer.baggageIncluded,
      seatsAvailable: offer.seatsAvailable,
      loyaltyProgram: offer.loyaltyProgram,
      returnFlightNumber: offer.returnFlightNumber,
      returnDepartureTime: offer.returnDepartureTime ? new Date(offer.returnDepartureTime) : undefined,
      returnArrivalTime: offer.returnArrivalTime ? new Date(offer.returnArrivalTime) : undefined,
      returnDurationMinutes: offer.returnDurationMinutes,
      returnStops: offer.returnStops,
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : undefined
    }));

    const hotelOptionRows = hotelOffers.map((offer) => ({
      tripRequestId: request.id,
      providerSearchSessionId: hotelSession.id,
      provider: offer.provider,
      providerHotelId: offer.providerHotelId,
      providerOfferId: offer.providerOfferId,
      name: offer.name,
      chain: offer.chain,
      stars: offer.stars,
      neighborhood: offer.neighborhood,
      city: offer.city,
      countryCode: offer.countryCode,
      address: offer.address,
      latitude: offer.latitude,
      longitude: offer.longitude,
      pricePerNightCents: offer.pricePerNightCents,
      totalPriceCents: offer.totalPriceCents,
      nights: offer.nights,
      currency: offer.currency,
      rating: offer.rating,
      reviewCount: offer.reviewCount,
      amenities: offer.amenities,
      refundable: offer.refundable,
      cancellationDeadline: offer.cancellationDeadline ? new Date(offer.cancellationDeadline) : undefined,
      roomType: offer.roomType,
      bedType: offer.bedType,
      distanceToCenterKm: offer.distanceToCenterKm,
      expiresAt: offer.expiresAt ? new Date(offer.expiresAt) : undefined
    }));

    const idBase = request.id.slice(-6);
    const flightRowsWithIds = flightOptionRows.map((row, index) => ({ ...row, id: `f${idBase}${index}`.slice(0, 25) }));
    const hotelRowsWithIds = hotelOptionRows.map((row, index) => ({ ...row, id: `h${idBase}${index}`.slice(0, 25) }));

    const packageRows = recommendationService.buildPackages({
      request,
      snapshot: request.preferenceSnapshot,
      flights: flightRowsWithIds,
      hotels: hotelRowsWithIds
    }).map((pkg, index) => ({
      ...pkg,
      id: `p${idBase}${index}`.slice(0, 25)
    }));

    await tripRepository.replaceSearchResults({
      requestId: request.id,
      tripId,
      flightOptions: flightRowsWithIds,
      hotelOptions: hotelRowsWithIds,
      tripPackages: packageRows,
      status: 'RECOMMENDATIONS_READY'
    });

    await tripRepository.createAgentMessages([
      {
        tripRequestId: request.id,
        role: 'ASSISTANT',
        type: 'STATUS',
        content: `${flightOffers.length} flight options and ${hotelOffers.length} hotel options were found.`
      },
      {
        tripRequestId: request.id,
        role: 'ASSISTANT',
        type: 'SUMMARY',
        content: `I built ${packageRows.length} bundled recommendations and ranked them by price fit, convenience, flexibility, and hotel quality.`
      }
    ]);

    await tripRepository.createAuditLog({
      userId,
      tripId,
      actorType: 'SYSTEM',
      action: 'trip.search_completed',
      details: {
        requestId: request.id,
        flightCount: flightOffers.length,
        hotelCount: hotelOffers.length,
        packageCount: packageRows.length
      }
    });

    return tripRepository.getLatestRequestByTripId(userId, tripId);
  }
};
