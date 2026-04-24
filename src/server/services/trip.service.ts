import { createTripSchema } from '@/lib/validations/trip';
import { tripRepository } from '@/server/repositories/trip.repository';
import { auditRepository } from '@/server/repositories/audit.repository';

export const tripService = {
  async createTrip(userId: string, payload: unknown) {
    const parsed = createTripSchema.parse(payload);

    const trip = await tripRepository.createTripWithRequest(userId, {
      title: parsed.title,
      originCode: parsed.originCode,
      originCity: parsed.originCity,
      destinationCode: parsed.destinationCode,
      destinationCity: parsed.destinationCity,
      departureDate: new Date(parsed.departureDate),
      returnDate: new Date(parsed.returnDate),
      travelerCount: parsed.travelerCount,
      budgetCents: parsed.budgetCents,
      currency: parsed.currency,
      cabinClass: parsed.cabinClass,
      preferDirectFlights: parsed.preferDirectFlights,
      hotelStarLevel: parsed.hotelStarLevel,
      neighborhoodPreference: parsed.neighborhoodPreference,
      amenities: parsed.amenities,
      refundableOnly: parsed.refundableOnly,
      notes: parsed.notes
    });

    await auditRepository.log({
      actorType: 'USER',
      action: 'trip.created',
      userId,
      tripId: trip.id,
      details: {
        requestId: trip.requests[0]?.id,
        destinationCode: parsed.destinationCode
      }
    });

    return trip;
  }
};
