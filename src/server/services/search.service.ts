import { AgentMessageRole, AgentMessageType, TripRequestStatus } from '@prisma/client';
import { createFlightProvider, createHotelProvider } from '@/server/integrations/provider-factory';
import { tripRepository } from '@/server/repositories/trip.repository';
import { recommendationService } from '@/server/services/recommendation.service';
import { aiService } from '@/server/services/ai.service';
import { auditRepository } from '@/server/repositories/audit.repository';
import { agentMessageRepository } from '@/server/repositories/agent-message.repository';

const flightProvider = createFlightProvider();
const hotelProvider = createHotelProvider();

export const searchService = {
  async runSearch(userId: string, tripId: string) {
    const request = await tripRepository.getLatestRequest(tripId, userId);
    if (!request) {
      throw new Error('TRIP_NOT_FOUND');
    }

    if (request.bookings.length) {
      throw new Error('This trip already has a selected booking. Duplicate the trip if you need to re-run search without overwriting booked state.');
    }

    await tripRepository.setSearching(tripId, request.id);
    await tripRepository.clearSearchArtifacts(request.id);

    const flightSession = await tripRepository.createSearchSession({
      tripRequestId: request.id,
      kind: 'FLIGHTS',
      provider: flightProvider.name,
      requestPayload: {
        originCode: request.originCode,
        destinationCode: request.destinationCode,
        departureDate: request.departureDate.toISOString().slice(0, 10),
        returnDate: request.returnDate.toISOString().slice(0, 10)
      }
    });

    const hotelSession = await tripRepository.createSearchSession({
      tripRequestId: request.id,
      kind: 'HOTELS',
      provider: hotelProvider.name,
      requestPayload: {
        destinationCity: request.destinationCity,
        destinationCode: request.destinationCode,
        checkInDate: request.departureDate.toISOString().slice(0, 10),
        checkOutDate: request.returnDate.toISOString().slice(0, 10)
      }
    });

    try {
      const [flightOffers, hotelOffers] = await Promise.all([
        flightProvider.search({
          originCode: request.originCode,
          destinationCode: request.destinationCode,
          departureDate: request.departureDate.toISOString().slice(0, 10),
          returnDate: request.returnDate.toISOString().slice(0, 10),
          travelerCount: request.travelerCount,
          cabinClass: request.cabinClass,
          preferDirectFlights: request.preferDirectFlights,
          refundableOnly: request.refundableOnly,
          currency: request.currency
        }),
        hotelProvider.search({
          destinationCity: request.destinationCity,
          destinationCode: request.destinationCode,
          checkInDate: request.departureDate.toISOString().slice(0, 10),
          checkOutDate: request.returnDate.toISOString().slice(0, 10),
          travelerCount: request.travelerCount,
          minStars: request.hotelStarLevel,
          neighborhoodPreference: request.neighborhoodPreference,
          amenities: request.amenities,
          refundableOnly: request.refundableOnly,
          currency: request.currency
        })
      ]);

      await tripRepository.completeSearchSession(flightSession.id, {
        status: 'COMPLETED',
        responsePayload: { count: flightOffers.length }
      });
      await tripRepository.completeSearchSession(hotelSession.id, {
        status: 'COMPLETED',
        responsePayload: { count: hotelOffers.length }
      });

      const stored = await tripRepository.storeSearchResults({
        tripRequestId: request.id,
        flightSessionId: flightSession.id,
        hotelSessionId: hotelSession.id,
        flights: flightOffers,
        hotels: hotelOffers
      });

      if (!stored.flights.length || !stored.hotels.length) {
        const summary = !stored.flights.length
          ? 'No flight offers were returned for that search. Try adjusting airport codes, dates, or cabin class.'
          : 'No hotel offers were returned for that search. Try using a city IATA code or broadening hotel preferences.';
        await tripRepository.setRequestStatus(request.id, TripRequestStatus.FAILED, summary);
        await tripRepository.setTripStatus(tripId, TripRequestStatus.FAILED);
        await agentMessageRepository.create({
          tripRequestId: request.id,
          role: AgentMessageRole.SYSTEM,
          type: AgentMessageType.ERROR,
          content: summary
        });
        return {
          flights: stored.flights.length,
          hotels: stored.hotels.length,
          packages: 0,
          summary
        };
      }

      const packages = recommendationService.buildPackages({
        request,
        flights: stored.flights,
        hotels: stored.hotels
      });

      const summary = await aiService.generateRecommendationSummary({
        trip: {
          title: request.trip.title,
          origin: request.originCity,
          destination: request.destinationCity,
          departureDate: request.departureDate.toISOString().slice(0, 10),
          returnDate: request.returnDate.toISOString().slice(0, 10),
          budgetCents: request.budgetCents,
          currency: request.currency,
          travelerCount: request.travelerCount,
          notes: request.notes
        },
        packages: packages.map((pkg) => ({
          ...pkg,
          flightOption: stored.flights.find((flight) => flight.id === pkg.flightOptionCacheId),
          hotelOption: stored.hotels.find((hotel) => hotel.id === pkg.hotelOptionCacheId)
        }))
      });

      await tripRepository.savePackages(request.id, packages, summary);
      await tripRepository.setTripStatus(tripId, TripRequestStatus.RECOMMENDATIONS_READY);
      await agentMessageRepository.create({
        tripRequestId: request.id,
        role: AgentMessageRole.SYSTEM,
        type: AgentMessageType.SUMMARY,
        content: summary
      });
      await auditRepository.log({
        actorType: 'USER',
        action: 'trip.search.completed',
        userId,
        tripId,
        details: {
          flightOffers: stored.flights.length,
          hotelOffers: stored.hotels.length,
          packages: packages.length,
          providers: {
            flight: flightProvider.name,
            hotel: hotelProvider.name
          }
        }
      });

      return {
        flights: stored.flights.length,
        hotels: stored.hotels.length,
        packages: packages.length,
        summary
      };
    } catch (error) {
      await tripRepository.completeSearchSession(flightSession.id, {
        status: 'FAILED',
        responsePayload: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      await tripRepository.completeSearchSession(hotelSession.id, {
        status: 'FAILED',
        responsePayload: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      await tripRepository.setRequestStatus(request.id, TripRequestStatus.FAILED, error instanceof Error ? error.message : 'Search failed.');
      await tripRepository.setTripStatus(tripId, TripRequestStatus.FAILED);
      throw error;
    }
  }
};
