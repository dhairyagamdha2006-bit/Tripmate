import { CabinClass } from '@prisma/client';
import type { FlightSearchProvider } from '@/server/integrations/contracts';
import type { FlightSearchInput, NormalizedFlightOffer } from '@/types/travel';

const baseFlights: Array<Omit<NormalizedFlightOffer, 'departureTime' | 'arrivalTime' | 'returnDepartureTime' | 'returnArrivalTime' | 'originCode' | 'destinationCode' | 'cabinClass'>> = [
  {
    provider: 'mock-flights',
    providerOfferId: 'ua-best-value',
    airline: 'United Airlines',
    airlineCode: 'UA',
    flightNumber: 'UA837',
    durationMinutes: 690,
    stops: 0,
    stopDetails: [],
    priceCents: 240000,
    currency: 'USD',
    refundable: true,
    changeable: true,
    baggageIncluded: true,
    seatsAvailable: 6,
    loyaltyProgram: 'United MileagePlus',
    returnFlightNumber: 'UA838',
    returnDurationMinutes: 630,
    returnStops: 0
  },
  {
    provider: 'mock-flights',
    providerOfferId: 'jl-premium',
    airline: 'Japan Airlines',
    airlineCode: 'JL',
    flightNumber: 'JL061',
    durationMinutes: 700,
    stops: 0,
    stopDetails: [],
    priceCents: 265000,
    currency: 'USD',
    refundable: true,
    changeable: true,
    baggageIncluded: true,
    seatsAvailable: 4,
    returnFlightNumber: 'JL062',
    returnDurationMinutes: 650,
    returnStops: 0
  },
  {
    provider: 'mock-flights',
    providerOfferId: 'ke-budget',
    airline: 'Korean Air',
    airlineCode: 'KE',
    flightNumber: 'KE002',
    durationMinutes: 840,
    stops: 1,
    stopDetails: ['ICN · 2h layover'],
    priceCents: 198000,
    currency: 'USD',
    refundable: false,
    changeable: true,
    baggageIncluded: true,
    seatsAvailable: 9,
    returnFlightNumber: 'KE001',
    returnDurationMinutes: 810,
    returnStops: 1
  }
];

function atHour(dateString: string, hour: number, minute = 0) {
  const date = new Date(dateString);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export class MockFlightProvider implements FlightSearchProvider {
  name = 'mock-flights';

  async searchFlights(input: FlightSearchInput): Promise<NormalizedFlightOffer[]> {
    const offers = baseFlights.map((offer) => ({
      ...offer,
      originCode: input.originCode,
      destinationCode: input.destinationCode,
      cabinClass: input.cabinClass,
      departureTime: atHour(input.departureDate, offer.airlineCode === 'UA' ? 11 : offer.airlineCode === 'JL' ? 13 : 9, offer.airlineCode === 'UA' ? 30 : 0),
      arrivalTime: new Date(new Date(atHour(input.departureDate, offer.airlineCode === 'UA' ? 11 : offer.airlineCode === 'JL' ? 13 : 9, offer.airlineCode === 'UA' ? 30 : 0)).getTime() + offer.durationMinutes * 60000).toISOString(),
      returnDepartureTime: offer.returnFlightNumber ? atHour(input.returnDate, offer.airlineCode === 'UA' ? 17 : offer.airlineCode === 'JL' ? 19 : 20) : undefined,
      returnArrivalTime: offer.returnFlightNumber && offer.returnDurationMinutes ? new Date(new Date(atHour(input.returnDate, offer.airlineCode === 'UA' ? 17 : offer.airlineCode === 'JL' ? 19 : 20)).getTime() + offer.returnDurationMinutes * 60000).toISOString() : undefined,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    } satisfies NormalizedFlightOffer));

    return offers
      .filter((offer) => (input.preferDirectFlights ? offer.stops === 0 : true))
      .filter((offer) => (input.refundableOnly ? offer.refundable : true))
      .map((offer) => ({
        ...offer,
        priceCents: applyCabinMultiplier(offer.priceCents, input.cabinClass)
      }));
  }
}

function applyCabinMultiplier(priceCents: number, cabinClass: CabinClass) {
  switch (cabinClass) {
    case CabinClass.FIRST:
      return Math.round(priceCents * 1.45);
    case CabinClass.BUSINESS:
      return priceCents;
    case CabinClass.PREMIUM_ECONOMY:
      return Math.round(priceCents * 0.68);
    case CabinClass.ECONOMY:
    default:
      return Math.round(priceCents * 0.52);
  }
}
