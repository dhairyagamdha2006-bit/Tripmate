import { BedType } from '@prisma/client';
import { nightsBetween } from '@/lib/utils/date';
import type { HotelSearchProvider } from '@/server/integrations/contracts';
import type { HotelSearchInput, NormalizedHotelOffer } from '@/types/travel';

const hotels: Array<Omit<NormalizedHotelOffer, 'totalPriceCents' | 'nights'>> = [
  {
    provider: 'mock-hotels',
    providerHotelId: 'park-hyatt-tokyo',
    providerOfferId: 'park-hyatt-rate',
    name: 'Park Hyatt Tokyo',
    chain: 'Hyatt',
    stars: 5,
    neighborhood: 'Shinjuku',
    city: 'Tokyo',
    countryCode: 'JP',
    address: '3-7-1-2 Nishi Shinjuku, Tokyo',
    latitude: 35.6854,
    longitude: 139.6917,
    pricePerNightCents: 52000,
    currency: 'USD',
    rating: 9.3,
    reviewCount: 2841,
    amenities: ['WiFi', 'Gym', 'Pool', 'Spa', 'Breakfast'],
    refundable: true,
    roomType: 'Deluxe King',
    bedType: BedType.KING,
    distanceToCenterKm: 0.8
  },
  {
    provider: 'mock-hotels',
    providerHotelId: 'shibuya-excel',
    providerOfferId: 'shibuya-rate',
    name: 'Shibuya Excel Hotel Tokyu',
    chain: 'Tokyu',
    stars: 4,
    neighborhood: 'Shibuya',
    city: 'Tokyo',
    countryCode: 'JP',
    address: '1-12-2 Dogenzaka, Shibuya-ku, Tokyo',
    latitude: 35.658,
    longitude: 139.7016,
    pricePerNightCents: 28000,
    currency: 'USD',
    rating: 8.6,
    reviewCount: 4120,
    amenities: ['WiFi', 'Gym', 'Restaurant', 'Breakfast'],
    refundable: true,
    roomType: 'Superior King',
    bedType: BedType.KING,
    distanceToCenterKm: 1.2
  },
  {
    provider: 'mock-hotels',
    providerHotelId: 'strings-by-ihg',
    providerOfferId: 'strings-rate',
    name: 'The Strings by InterContinental',
    chain: 'InterContinental',
    stars: 5,
    neighborhood: 'Minato',
    city: 'Tokyo',
    countryCode: 'JP',
    address: '2-16-1 Konan, Minato-ku, Tokyo',
    latitude: 35.6286,
    longitude: 139.7407,
    pricePerNightCents: 41000,
    currency: 'USD',
    rating: 9.0,
    reviewCount: 1763,
    amenities: ['WiFi', 'Gym', 'Breakfast', 'Bar'],
    refundable: false,
    roomType: 'Club King',
    bedType: BedType.KING,
    distanceToCenterKm: 2.0
  }
];

export class MockHotelProvider implements HotelSearchProvider {
  name = 'mock-hotels';

  async searchHotels(input: HotelSearchInput): Promise<NormalizedHotelOffer[]> {
    const nights = nightsBetween(input.checkInDate, input.checkOutDate);

    return hotels
      .filter((hotel) => hotel.stars >= input.minStars)
      .filter((hotel) => (input.refundableOnly ? hotel.refundable : true))
      .filter((hotel) => {
        if (!input.neighborhoodPreference) return true;
        return input.neighborhoodPreference.toLowerCase().includes((hotel.neighborhood ?? '').toLowerCase()) || hotel.stars >= input.minStars;
      })
      .map((hotel) => ({
        ...hotel,
        nights,
        totalPriceCents: hotel.pricePerNightCents * nights,
        cancellationDeadline: hotel.refundable ? new Date(new Date(input.checkInDate).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      }));
  }
}
