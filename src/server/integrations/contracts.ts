import { NotificationPayload, FlightSearchInput, HotelSearchInput, NormalizedFlightOffer, NormalizedHotelOffer } from '@/types/travel';

export interface FlightProvider {
  readonly name: string;
  search(input: FlightSearchInput): Promise<NormalizedFlightOffer[]>;
}

export interface HotelProvider {
  readonly name: string;
  search(input: HotelSearchInput): Promise<NormalizedHotelOffer[]>;
}

export interface EmailProvider {
  readonly name: string;
  send(input: NotificationPayload): Promise<{ providerMessageId?: string }>;
}
