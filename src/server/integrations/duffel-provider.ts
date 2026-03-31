import type { FlightSearchProvider } from '@/server/integrations/contracts';
import type { FlightSearchInput, NormalizedFlightOffer } from '@/types/travel';

export class DuffelFlightProvider implements FlightSearchProvider {
  name = 'duffel';

  async searchFlights(_input: FlightSearchInput): Promise<NormalizedFlightOffer[]> {
    throw new Error('Duffel integration is not implemented yet. Replace this placeholder when provider credentials are available.');
  }
}
