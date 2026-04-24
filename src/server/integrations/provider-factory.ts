import type { FlightProvider, HotelProvider } from './contracts';
import { AmadeusFlightProvider, AmadeusHotelProvider, UnconfiguredFlightProvider, UnconfiguredHotelProvider } from './amadeus-provider';

export function createFlightProvider(): FlightProvider {
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return new AmadeusFlightProvider();
  }
  return new UnconfiguredFlightProvider();
}

export function createHotelProvider(): HotelProvider {
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return new AmadeusHotelProvider();
  }
  return new UnconfiguredHotelProvider();
}
