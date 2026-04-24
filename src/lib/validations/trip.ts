import { CabinClass } from '@prisma/client';
import { z } from 'zod';

const codeSchema = z.string().trim().toUpperCase().length(3);

export const createTripSchema = z.object({
  title: z.string().trim().min(3).max(120),
  originCode: codeSchema,
  originCity: z.string().trim().min(2).max(80),
  destinationCode: codeSchema,
  destinationCity: z.string().trim().min(2).max(80),
  departureDate: z.string().min(1),
  returnDate: z.string().min(1),
  travelerCount: z.coerce.number().int().min(1).max(9),
  budgetCents: z.coerce.number().int().min(50_00),
  currency: z.string().trim().toUpperCase().length(3).default('USD'),
  cabinClass: z.nativeEnum(CabinClass).default(CabinClass.ECONOMY),
  preferDirectFlights: z.coerce.boolean().default(false),
  hotelStarLevel: z.coerce.number().int().min(1).max(5).default(3),
  neighborhoodPreference: z.string().trim().max(120).optional().nullable(),
  amenities: z.array(z.string().trim().min(1).max(60)).default([]),
  refundableOnly: z.coerce.boolean().default(false),
  notes: z.string().trim().max(1000).optional().nullable()
}).superRefine((value, ctx) => {
  const departure = new Date(value.departureDate);
  const returning = new Date(value.returnDate);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(returning.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid travel dates.' });
    return;
  }

  if (returning <= departure) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Return date must be after departure date.' });
  }
});

export const selectPackageSchema = z.object({
  packageId: z.string().min(1)
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000)
});

export const shareTripSchema = z.object({
  note: z.string().trim().max(500).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable()
});

export const sendShareEmailSchema = z.object({
  shareId: z.string().min(1),
  email: z.string().email(),
  recipientName: z.string().trim().min(1).max(80)
});
