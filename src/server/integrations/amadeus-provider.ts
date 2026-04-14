import type { FlightSearchProvider } from './contracts';
import type { FlightSearchInput, NormalizedFlightOffer } from '@/types/travel';
import type { CabinClass } from '@prisma/client';

const CABIN_MAP: Record<CabinClass, string> = {
  ECONOMY: 'ECONOMY',
  PREMIUM_ECONOMY: 'PREMIUM_ECONOMY',
  BUSINESS: 'BUSINESS',
  FIRST: 'FIRST'
};

export class AmadeusFlightProvider implements FlightSearchProvider {
  name = 'amadeus';

  private async getToken(): Promise<string> {
    const host = process.env.AMADEUS_HOSTNAME === 'production'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';

    const res = await fetch(`${host}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AMADEUS_CLIENT_ID!,
        client_secret: process.env.AMADEUS_CLIENT_SECRET!
      })
    });
    if (!res.ok) throw new Error(`Amadeus token failed: ${res.status}`);
    const data = await res.json();
    return data.access_token as string;
  }

  async searchFlights(input: FlightSearchInput): Promise<NormalizedFlightOffer[]> {
    const host = process.env.AMADEUS_HOSTNAME === 'production'
      ? 'https://api.amadeus.com'
      : 'https://test.api.amadeus.com';

    const token = await this.getToken();
    const params = new URLSearchParams({
      originLocationCode: input.originCode,
      destinationLocationCode: input.destinationCode,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      adults: String(input.travelerCount),
      travelClass: CABIN_MAP[input.cabinClass],
      nonStop: String(input.preferDirectFlights),
      currencyCode: input.currency,
      max: '10'
    });

    const res = await fetch(`${host}/v2/shopping/flight-offers?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Amadeus search failed: ${res.status}`);

    const json = await res.json();
    const offers = (json.data ?? []) as any[];

    return offers
      .filter((o) => input.refundableOnly
        ? o.pricingOptions?.fareType?.includes('REFUNDABLE')
        : true)
      .map((o) => this.normalize(o, input));
  }

  private normalize(o: any, input: FlightSearchInput): NormalizedFlightOffer {
    const out = o.itineraries[0];
    const ret = o.itineraries[1];
    const first = out.segments[0];
    const last = out.segments[out.segments.length - 1];

    const toMins = (iso: string) => {
      const h = parseInt(iso.match(/(\d+)H/)?.[1] ?? '0', 10);
      const m = parseInt(iso.match(/(\d+)M/)?.[1] ?? '0', 10);
      return h * 60 + m;
    };

    const result: NormalizedFlightOffer = {
      provider: 'amadeus',
      providerOfferId: o.id,
      airline: first.carrierCode,
      airlineCode: first.carrierCode,
      flightNumber: `${first.carrierCode}${first.number}`,
      originCode: input.originCode,
      destinationCode: input.destinationCode,
      departureTime: first.departure.at,
      arrivalTime: last.arrival.at,
      durationMinutes: toMins(out.duration),
      stops: out.segments.length - 1,
      stopDetails: out.segments.slice(0, -1).map((s: any) => `${s.arrival.iataCode} · transit`),
      cabinClass: input.cabinClass,
      priceCents: Math.round(parseFloat(o.price.total) * 100),
      currency: o.price.currency,
      refundable: o.pricingOptions?.fareType?.includes('REFUNDABLE') ?? false,
      changeable: false,
      baggageIncluded: o.pricingOptions?.includedCheckedBagsOnly ?? false,
      seatsAvailable: o.numberOfBookableSeats,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    if (ret) {
      const rf = ret.segments[0];
      const rl = ret.segments[ret.segments.length - 1];
      result.returnFlightNumber = `${rf.carrierCode}${rf.number}`;
      result.returnDepartureTime = rf.departure.at;
      result.returnArrivalTime = rl.arrival.at;
      result.returnDurationMinutes = toMins(ret.duration);
      result.returnStops = ret.segments.length - 1;
    }

    return result;
  }
}
