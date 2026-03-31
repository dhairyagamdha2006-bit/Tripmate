import { profileService } from '@/server/services/profile.service';
import { tripRepository } from '@/server/repositories/trip.repository';
import type { TripRequestInput } from '@/lib/validations/trips';

export const tripRequestService = {
  async createTrip(userId: string, input: TripRequestInput) {
    const profile = await profileService.getProfile(userId);

    const title = `${input.destinationCity} trip`;
    const trip = await tripRepository.createTripWithRequest({
      userId,
      title,
      originLabel: `${input.originCity} (${input.originCode})`,
      destinationLabel: `${input.destinationCity} (${input.destinationCode})`,
      departureDate: new Date(input.departureDate),
      returnDate: new Date(input.returnDate),
      travelerCount: input.travelerCount,
      request: {
        originCode: input.originCode,
        originCity: input.originCity,
        destinationCode: input.destinationCode,
        destinationCity: input.destinationCity,
        departureDate: new Date(input.departureDate),
        returnDate: new Date(input.returnDate),
        travelerCount: input.travelerCount,
        budgetCents: Math.round(input.budgetUsd * 100),
        currency: 'USD',
        cabinClass: input.cabinClass,
        preferDirectFlights: input.preferDirectFlights,
        hotelStarLevel: input.hotelStarLevel,
        neighborhoodPreference: input.neighborhoodPreference || null,
        amenities: input.amenities,
        refundableOnly: input.refundableOnly,
        notes: input.notes || null
      },
      preferenceSnapshot: profile
        ? {
            travelerProfileId: profile.id,
            homeAirportCode: profile.homeAirportCode,
            preferredCabinClass: profile.preferredCabinClass,
            preferDirectFlights: profile.preferDirectFlights,
            seatPreference: profile.seatPreference,
            preferredHotelChains: profile.preferredHotelChains,
            bedType: profile.bedType,
            smokingPreference: profile.smokingPreference,
            accessibilityNeeds: profile.accessibilityNeeds
          }
        : undefined
    });

    await tripRepository.createAuditLog({
      userId,
      tripId: trip.id,
      actorType: 'USER',
      action: 'trip.created',
      details: { destination: input.destinationCity }
    });

    return trip;
  }
};
