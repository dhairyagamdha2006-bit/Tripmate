import type { TravelerProfileInput } from '@/lib/validations/profile';
import { travelerProfileRepository } from '@/server/repositories/traveler-profile.repository';

export const profileService = {
  getProfile(userId: string) {
    return travelerProfileRepository.getByUserId(userId);
  },

  async saveProfile(userId: string, input: TravelerProfileInput) {
    return travelerProfileRepository.upsertByUserId(userId, {
      userId,
      fullLegalName: input.fullLegalName,
      dateOfBirth: new Date(input.dateOfBirth),
      nationality: input.nationality,
      passportNumber: input.passportNumber,
      passportExpiry: new Date(input.passportExpiry),
      homeAirportCode: input.homeAirportCode,
      preferredCabinClass: input.preferredCabinClass,
      seatPreference: input.seatPreference,
      preferDirectFlights: input.preferDirectFlights,
      preferredHotelChains: input.preferredHotelChains,
      bedType: input.bedType ?? null,
      smokingPreference: input.smokingPreference,
      accessibilityNeeds: input.accessibilityNeeds,
      loyaltyPrograms: input.loyaltyPrograms
    });
  }
};
