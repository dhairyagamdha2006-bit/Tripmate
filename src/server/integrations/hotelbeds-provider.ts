import type { HotelSearchProvider } from '@/server/integrations/contracts';
import type { HotelSearchInput, NormalizedHotelOffer } from '@/types/travel';

export class HotelbedsProvider implements HotelSearchProvider {
  name = 'hotelbeds';

  async searchHotels(_input: HotelSearchInput): Promise<NormalizedHotelOffer[]> {
    throw new Error('Hotelbeds integration is not implemented yet. Replace this placeholder when provider credentials are available.');
  }
}
