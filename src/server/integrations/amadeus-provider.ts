import { CabinClass } from '@prisma/client';
import type { FlightProvider, HotelProvider } from './contracts';
import type { FlightSearchInput, HotelSearchInput, NormalizedFlightOffer, NormalizedHotelOffer } from '@/types/travel';
import { differenceInNights } from '@/lib/utils/date';
import { amadeusClient } from './amadeus-client';

function cents(amount: string | number | undefined | null) {
  const value = typeof amount === 'string' ? Number(amount) : amount ?? 0;
  return Math.round(value * 100);
}

function minutesFromIsoDuration(value: string | undefined) {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const hours = match?.[1] ? Number(match[1]) : 0;
  const minutes = match?.[2] ? Number(match[2]) : 0;
  return hours * 60 + minutes;
}

function normalizeCabin(value?: string | null): CabinClass {
  switch ((value ?? '').toUpperCase()) {
    case 'PREMIUM_ECONOMY':
      return CabinClass.PREMIUM_ECONOMY;
    case 'BUSINESS':
      return CabinClass.BUSINESS;
    case 'FIRST':
      return CabinClass.FIRST;
    default:
      return CabinClass.ECONOMY;
  }
}

async function resolveHotelCityCode(input: HotelSearchInput) {
  try {
    const data = await amadeusClient.get<{ data?: Array<{ iataCode?: string; address?: { cityCode?: string } }> }>('/v1/reference-data/locations', {
      keyword: input.destinationCity,
      subType: 'CITY,AIRPORT',
      'page[limit]': 1,
      view: 'LIGHT'
    });

    return data.data?.[0]?.address?.cityCode ?? data.data?.[0]?.iataCode ?? input.destinationCode;
  } catch {
    return input.destinationCode;
  }
}

export class AmadeusFlightProvider implements FlightProvider {
  readonly name = 'amadeus';

  async search(input: FlightSearchInput): Promise<NormalizedFlightOffer[]> {
    const response = await amadeusClient.get<any>('/v2/shopping/flight-offers', {
      originLocationCode: input.originCode,
      destinationLocationCode: input.destinationCode,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      adults: input.travelerCount,
      travelClass: input.cabinClass,
      nonStop: input.preferDirectFlights,
      currencyCode: input.currency,
      max: 20
    });

    const carriers = response.dictionaries?.carriers ?? {};

    return (response.data ?? []).map((offer: any) => {
      const outbound = offer.itineraries?.[0];
      const inbound = offer.itineraries?.[1];
      const firstSegment = outbound?.segments?.[0];
      const lastSegment = outbound?.segments?.[outbound?.segments?.length - 1];
      const firstInbound = inbound?.segments?.[0];
      const lastInbound = inbound?.segments?.[inbound?.segments?.length - 1];
      const fareDetails = offer.travelerPricings?.[0]?.fareDetailsBySegment ?? [];
      const validatingCarrier = offer.validatingAirlineCodes?.[0] ?? firstSegment?.carrierCode ?? 'NA';

      return {
        provider: this.name,
        providerOfferId: offer.id,
        airline: carriers[validatingCarrier] ?? validatingCarrier,
        airlineCode: validatingCarrier,
        flightNumber: `${firstSegment?.carrierCode ?? ''}${firstSegment?.number ?? ''}`,
        originCode: firstSegment?.departure?.iataCode ?? input.originCode,
        destinationCode: lastSegment?.arrival?.iataCode ?? input.destinationCode,
        departureTime: firstSegment?.departure?.at,
        arrivalTime: lastSegment?.arrival?.at,
        durationMinutes: minutesFromIsoDuration(outbound?.duration),
        stops: Math.max(0, (outbound?.segments?.length ?? 1) - 1),
        stopDetails: (outbound?.segments ?? []).slice(0, -1).map((segment: any) => segment.arrival?.iataCode).filter(Boolean),
        cabinClass: normalizeCabin(fareDetails[0]?.cabin ?? input.cabinClass),
        priceCents: cents(offer.price?.grandTotal),
        currency: offer.price?.currency ?? input.currency,
        refundable: Boolean(offer.pricingOptions?.refundableFare),
        changeable: Boolean(offer.pricingOptions?.includedCheckedBagsOnly) || Boolean(offer.price?.fees?.length),
        baggageIncluded: fareDetails.some((segment: any) => (segment.includedCheckedBags?.quantity ?? 0) > 0),
        seatsAvailable: offer.numberOfBookableSeats,
        returnFlightNumber: firstInbound ? `${firstInbound.carrierCode ?? ''}${firstInbound.number ?? ''}` : undefined,
        returnDepartureTime: firstInbound?.departure?.at,
        returnArrivalTime: lastInbound?.arrival?.at,
        returnDurationMinutes: minutesFromIsoDuration(inbound?.duration),
        returnStops: inbound ? Math.max(0, (inbound?.segments?.length ?? 1) - 1) : undefined,
        expiresAt: offer.lastTicketingDate,
        offerJson: offer
      } satisfies NormalizedFlightOffer;
    });
  }
}

export class AmadeusHotelProvider implements HotelProvider {
  readonly name = 'amadeus';

  async search(input: HotelSearchInput): Promise<NormalizedHotelOffer[]> {
    const cityCode = await resolveHotelCityCode(input);
    const hotelsResponse = await amadeusClient.get<any>('/v1/reference-data/locations/hotels/by-city', {
      cityCode,
      radius: 25,
      radiusUnit: 'KM'
    });

    const hotelIds = (hotelsResponse.data ?? []).map((hotel: any) => hotel.hotelId).filter(Boolean).slice(0, 20);

    if (!hotelIds.length) {
      return [];
    }

    const offersResponse = await amadeusClient.get<any>('/v3/shopping/hotel-offers', {
      hotelIds: hotelIds.join(','),
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      adults: input.travelerCount,
      currency: input.currency,
      bestRateOnly: true,
      roomQuantity: 1
    });

    const nights = differenceInNights(new Date(input.checkInDate), new Date(input.checkOutDate));

    return (offersResponse.data ?? [])
      .map((hotel: any) => {
        const offer = hotel.offers?.[0];
        if (!offer) return null;
        const hotelStars = Number(hotel.hotel?.rating ?? hotel.hotel?.stars ?? 0);
        const cancellation = offer.policies?.cancellations?.[0];
        const total = cents(offer.price?.total ?? offer.price?.base);
        const perNight = Math.round(total / Math.max(1, nights));
        const amenities = (hotel.hotel?.amenities ?? []).map((item: string) => item.toLowerCase().replaceAll('_', ' '));
        const bedTypeRaw = offer.room?.typeEstimated?.bedType;

        return {
          provider: this.name,
          providerHotelId: hotel.hotel?.hotelId ?? hotel.hotel?.dupeId ?? `${hotel.hotel?.name ?? 'hotel'}-${offer.id}`,
          providerOfferId: offer.id,
          name: hotel.hotel?.name ?? 'Hotel',
          chain: hotel.hotel?.chainCode ?? undefined,
          stars: Number.isFinite(hotelStars) ? hotelStars : input.minStars,
          neighborhood: hotel.hotel?.address?.district ?? input.neighborhoodPreference ?? undefined,
          city: hotel.hotel?.address?.cityName ?? input.destinationCity,
          countryCode: hotel.hotel?.address?.countryCode ?? 'US',
          address: [hotel.hotel?.address?.lines?.join(', '), hotel.hotel?.address?.cityName].filter(Boolean).join(', '),
          latitude: hotel.hotel?.geoCode?.latitude,
          longitude: hotel.hotel?.geoCode?.longitude,
          pricePerNightCents: perNight,
          totalPriceCents: total,
          nights,
          currency: offer.price?.currency ?? input.currency,
          rating: Number.isFinite(Number(hotel.hotel?.rating)) ? Number(hotel.hotel?.rating) : undefined,
          reviewCount: hotel.hotel?.reviews?.length,
          amenities,
          refundable: Boolean(cancellation?.deadline || offer.policies?.paymentType === 'PAY_AT_HOTEL'),
          cancellationDeadline: cancellation?.deadline,
          roomType: offer.room?.description?.text ?? offer.room?.typeEstimated?.category,
          bedType: typeof bedTypeRaw === 'string' && ['KING', 'QUEEN', 'TWIN', 'DOUBLE'].includes(bedTypeRaw.toUpperCase()) ? bedTypeRaw.toUpperCase() as any : undefined,
          distanceToCenterKm: hotel.hotel?.distance?.value,
          expiresAt: offer.checkInDate,
          offerJson: { hotel, offer }
        } satisfies NormalizedHotelOffer;
      })
      .filter(Boolean)
      .filter((hotel) => hotel!.stars >= input.minStars)
      .filter((hotel) => !input.refundableOnly || hotel!.refundable)
      .filter((hotel) => !input.amenities.length || input.amenities.every((amenity) => hotel!.amenities.includes(amenity.toLowerCase()))) as NormalizedHotelOffer[];
  }
}

export class UnconfiguredFlightProvider implements FlightProvider {
  readonly name = 'unconfigured';
  async search(): Promise<NormalizedFlightOffer[]> {
    throw new Error('AMADEUS_NOT_CONFIGURED');
  }
}

export class UnconfiguredHotelProvider implements HotelProvider {
  readonly name = 'unconfigured';
  async search(): Promise<NormalizedHotelOffer[]> {
    throw new Error('AMADEUS_NOT_CONFIGURED');
  }
}
