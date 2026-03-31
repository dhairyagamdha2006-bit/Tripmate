import { CabinClass } from '@prisma/client';
import { z } from 'zod';

export const tripRequestSchema = z.object({
  originCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter airport code'),
  originCity: z.string().trim().min(2, 'Origin city is required'),
  destinationCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Use a 3-letter airport code'),
  destinationCity: z.string().trim().min(2, 'Destination city is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  returnDate: z.string().min(1, 'Return date is required'),
  travelerCount: z.coerce.number().int().min(1, 'At least one traveler is required').max(9),
  budgetUsd: z.coerce.number().int().positive('Budget must be positive').max(100000),
  cabinClass: z.nativeEnum(CabinClass),
  preferDirectFlights: z.boolean(),
  hotelStarLevel: z.coerce.number().int().min(1).max(5),
  neighborhoodPreference: z.string().trim().max(120).optional().or(z.literal('')),
  amenities: z.array(z.string().trim().min(1)).default([]),
  refundableOnly: z.boolean(),
  notes: z.string().trim().max(500).optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  const departure = new Date(data.departureDate);
  const ret = new Date(data.returnDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(departure.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureDate'], message: 'Enter a valid departure date' });
  } else if (departure < today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['departureDate'], message: 'Departure date cannot be in the past' });
  }

  if (Number.isNaN(ret.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Enter a valid return date' });
  } else if (ret <= departure) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['returnDate'], message: 'Return date must be after departure date' });
  }
});

export const packageSelectionSchema = z.object({
  packageId: z.string().min(1, 'Select a valid package')
});

export const bookingApprovalSchema = z.object({
  approved: z.literal(true),
  paymentMethodId: z.string().min(1).optional()
});

export type TripRequestInput = z.infer<typeof tripRequestSchema>;
export type PackageSelectionInput = z.infer<typeof packageSelectionSchema>;
export type BookingApprovalInput = z.infer<typeof bookingApprovalSchema>;
