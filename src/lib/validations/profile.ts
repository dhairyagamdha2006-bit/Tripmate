import { BedType, CabinClass, SeatPreference, SmokingPreference } from '@prisma/client';
import { z } from 'zod';

export const travelerProfileSchema = z.object({
  fullLegalName: z.string().trim().min(3).max(120),
  dateOfBirth: z.string().min(1),
  nationality: z.string().trim().min(2).max(60),
  passportNumber: z.string().trim().min(5).max(30),
  passportExpiry: z.string().min(1),
  passportIssuingCountry: z.string().trim().min(2).max(60).optional().nullable(),
  phoneNumber: z.string().trim().max(30).optional().nullable(),
  gender: z.string().trim().max(30).optional().nullable(),
  homeAirportCode: z.string().trim().toUpperCase().length(3),
  preferredCabinClass: z.nativeEnum(CabinClass),
  seatPreference: z.nativeEnum(SeatPreference),
  preferDirectFlights: z.coerce.boolean().default(false),
  preferredHotelChains: z.array(z.string().trim().min(1).max(40)).default([]),
  bedType: z.nativeEnum(BedType).optional().nullable(),
  smokingPreference: z.nativeEnum(SmokingPreference),
  accessibilityNeeds: z.array(z.string().trim().min(1).max(120)).default([]),
  loyaltyPrograms: z.array(
    z.object({
      program: z.string().trim().min(1).max(60),
      memberId: z.string().trim().min(1).max(60)
    })
  ).default([])
});
