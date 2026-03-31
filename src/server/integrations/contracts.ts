import type {
  BookingProviderResult,
  BookingRequestPayload,
  FlightSearchInput,
  HotelSearchInput,
  NormalizedFlightOffer,
  NormalizedHotelOffer,
  NotificationPayload,
  PaymentAuthorizationInput,
  PaymentAuthorizationResult
} from '@/types/travel';

export interface FlightSearchProvider {
  name: string;
  searchFlights(input: FlightSearchInput): Promise<NormalizedFlightOffer[]>;
}

export interface HotelSearchProvider {
  name: string;
  searchHotels(input: HotelSearchInput): Promise<NormalizedHotelOffer[]>;
}

export interface BookingProvider {
  name: string;
  createBooking(input: BookingRequestPayload): Promise<BookingProviderResult>;
}

export interface PaymentProvider {
  name: string;
  authorize(input: PaymentAuthorizationInput): Promise<PaymentAuthorizationResult>;
}

export interface NotificationProvider {
  name: string;
  send(input: NotificationPayload): Promise<void>;
}
