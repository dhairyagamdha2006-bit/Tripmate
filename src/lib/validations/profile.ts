import { BedType, CabinClass, SeatPreference, SmokingPreference } from '@prisma/client';
import { z } from 'zod';

const loyaltyProgramSchema = z.object({
  program: z.string().trim().min(1, 'Program name is required'),
  memberId: z.string().trim().min(1, 'Member ID is required')
});

export const travelerProfileSchema = z.object({
  fullLegalName: z.string().trim().min(3, 'Legal name is required'),
  dateOfBirth: z.string().min(1, 'Birth date is required'),
  nationality: z.string().trim().min(2, 'Nationality is required'),
  passportNumber: z.string().trim().min(6, 'Passport number is required'),
  passportExpiry: z.string().min(1, 'Passport expiry is required'),
  homeAirportCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter airport code'),
  preferredCabinClass: z.nativeEnum(CabinClass),
  seatPreference: z.nativeEnum(SeatPreference),
  preferDirectFlights: z.boolean(),
  preferredHotelChains: z.array(z.string().trim().min(1)).default([]),
  bedType: z.nativeEnum(BedType).nullable().optional(),
  smokingPreference: z.nativeEnum(SmokingPreference),
  accessibilityNeeds: z.array(z.string().trim().min(1)).default([]),
  loyaltyPrograms: z.array(loyaltyProgramSchema).default([])
}).superRefine((data, ctx) => {
  const birthDate = new Date(data.dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['dateOfBirth'], message: 'Enter a valid birth date' });
  }

  const passportExpiry = new Date(data.passportExpiry);
  if (Number.isNaN(passportExpiry.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passportExpiry'], message: 'Enter a valid passport expiry date' });
  } else if (passportExpiry <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passportExpiry'], message: 'Passport expiry must be in the future' });
  }
});

export type TravelerProfileInput = z.infer<typeof travelerProfileSchema>;
