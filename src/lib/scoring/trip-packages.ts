import type { CabinClass, PackageLabel, TripRequest, TripPreferenceSnapshot, BedType } from '@prisma/client';
import type { PackageScore } from '@/types/travel';

export type PackageFlightCandidate = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  stops: number;
  stopDetails: string[];
  cabinClass: CabinClass;
  priceCents: number;
  currency: string;
  refundable: boolean;
  changeable: boolean;
  baggageIncluded: boolean;
  seatsAvailable?: number | null;
  loyaltyProgram?: string | null;
  returnFlightNumber?: string | null;
  returnDepartureTime?: Date | null;
  returnArrivalTime?: Date | null;
  returnDurationMinutes?: number | null;
  returnStops?: number | null;
};

export type PackageHotelCandidate = {
  id: string;
  name: string;
  chain?: string | null;
  stars: number;
  neighborhood?: string | null;
  city: string;
  address: string;
  pricePerNightCents: number;
  totalPriceCents: number;
  nights: number;
  currency: string;
  rating?: number | null;
  reviewCount?: number | null;
  amenities: string[];
  refundable: boolean;
  cancellationDeadline?: Date | null;
  roomType?: string | null;
  bedType?: BedType | null;
  distanceToCenterKm?: number | null;
};

export function scorePackage(args: {
  request: TripRequest;
  flight: PackageFlightCandidate;
  hotel: PackageHotelCandidate;
  snapshot?: TripPreferenceSnapshot | null;
}): PackageScore {
  const { request, flight, hotel, snapshot } = args;
  const totalPriceCents = flight.priceCents * request.travelerCount + hotel.totalPriceCents;

  const budgetDelta = request.budgetCents - totalPriceCents;
  const priceFit = clamp(
    budgetDelta >= 0
      ? 78 + Math.min(22, Math.round((budgetDelta / Math.max(request.budgetCents, 1)) * 40))
      : 78 - Math.min(78, Math.round((Math.abs(budgetDelta) / Math.max(request.budgetCents, 1)) * 120)),
    0,
    100
  );

  const directnessBoost = flight.stops === 0 ? 18 : flight.stops === 1 ? 6 : 0;
  const convenience = clamp(62 + directnessBoost + (flight.baggageIncluded ? 8 : 0) + (flight.changeable ? 8 : 0), 0, 100);

  const travelDuration = clamp(100 - Math.round(Math.max(flight.durationMinutes - 600, 0) / 8), 55, 100);
  const hotelQuality = clamp(Math.round((hotel.stars / 5) * 60 + (hotel.rating ?? 8) * 4), 40, 100);
  const refundFlexibility = clamp((flight.refundable ? 45 : 10) + (hotel.refundable ? 45 : 10), 0, 100);

  let preferenceMatch = 55;
  if (snapshot?.preferDirectFlights && flight.stops === 0) preferenceMatch += 15;
  if (snapshot?.preferredCabinClass === flight.cabinClass) preferenceMatch += 10;
  if (snapshot?.preferredHotelChains.length && hotel.chain && snapshot.preferredHotelChains.includes(hotel.chain)) preferenceMatch += 10;
  if (request.neighborhoodPreference && hotel.neighborhood && request.neighborhoodPreference.toLowerCase().includes(hotel.neighborhood.toLowerCase())) preferenceMatch += 10;
  if (hotel.stars >= request.hotelStarLevel) preferenceMatch += 10;
  preferenceMatch = clamp(preferenceMatch, 0, 100);

  const overall = Math.round(
    priceFit * 0.28 +
      convenience * 0.17 +
      travelDuration * 0.15 +
      hotelQuality * 0.18 +
      refundFlexibility * 0.12 +
      preferenceMatch * 0.10
  );

  return {
    overall,
    priceFit,
    convenience,
    travelDuration,
    hotelQuality,
    refundFlexibility,
    preferenceMatch
  };
}

export function choosePackageLabel(kind: 'best' | 'cheapest' | 'convenient' | 'premium' | 'flexible'): PackageLabel {
  switch (kind) {
    case 'cheapest':
      return 'CHEAPEST';
    case 'convenient':
      return 'MOST_CONVENIENT';
    case 'premium':
      return 'PREMIUM';
    case 'flexible':
      return 'MOST_FLEXIBLE';
    case 'best':
    default:
      return 'BEST_VALUE';
  }
}

export function buildPackageExplanation(args: {
  label: PackageLabel;
  score: PackageScore;
  request: TripRequest;
  flight: PackageFlightCandidate;
  hotel: PackageHotelCandidate;
}): { explanation: string; highlights: string[]; warnings: string[] } {
  const { label, score, request, flight, hotel } = args;
  const totalPrice = flight.priceCents * request.travelerCount + hotel.totalPriceCents;
  const withinBudget = totalPrice <= request.budgetCents;
  const highlights: string[] = [];
  const warnings: string[] = [];

  if (flight.stops === 0) highlights.push('Direct flights both ways');
  if (flight.refundable && hotel.refundable) highlights.push('Fully refundable bundle');
  if (hotel.neighborhood) highlights.push(`${hotel.neighborhood} location`);
  if ((hotel.rating ?? 0) >= 8.8) highlights.push('Highly rated hotel');
  if (withinBudget) highlights.push('Within your stated budget');
  if (flight.loyaltyProgram) highlights.push(`${flight.loyaltyProgram} eligible`);

  if (!withinBudget) warnings.push('Above your current budget');
  if (flight.stops > 0) warnings.push(flight.stops === 1 ? 'Includes one stop' : `Includes ${flight.stops} stops`);
  if (!flight.refundable || !hotel.refundable) warnings.push('Contains at least one non-refundable component');

  const explanation = {
    BEST_VALUE: `Best overall fit balancing price, convenience, and hotel quality. It scored ${score.overall}/100 and ${withinBudget ? 'stays within' : 'runs above'} your budget.`,
    CHEAPEST: 'Lowest total price among the top bundles. It is best when budget matters most, though it may trade away some flexibility or convenience.',
    MOST_CONVENIENT: 'Optimized for easier travel with fewer stops and shorter total trip time. It is the smoothest option in this set.',
    PREMIUM: 'Highest-end overall stay with stronger hotel quality and service, chosen for a more premium travel experience.',
    MOST_FLEXIBLE: 'Best cancellation and change flexibility, making it the safest option if your plans may change.'
  }[label];

  return { explanation, highlights: highlights.slice(0, 4), warnings: warnings.slice(0, 3) };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
