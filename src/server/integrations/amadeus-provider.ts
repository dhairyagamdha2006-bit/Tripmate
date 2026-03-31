import type { FlightSearchProvider } from '@/server/integrations/contracts';
import type { FlightSearchInput, NormalizedFlightOffer } from '@/types/travel';

export class AmadeusFlightProvider implements FlightSearchProvider {
  name = 'amadeus';

  async searchFlights(_input: FlightSearchInput): Promise<NormalizedFlightOffer[]> {
    throw new Error('Amadeus integration is not implemented yet. Replace this placeholder when provider credentials are available.');
  }
}
