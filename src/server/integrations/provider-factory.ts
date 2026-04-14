/**
 * Provider Factory
 * Reads env vars and returns the correct provider.
 * Every service imports from here — never instantiates providers directly.
 */
import type {
  FlightSearchProvider,
  HotelSearchProvider,
  BookingProvider,
  PaymentProvider,
  NotificationProvider
} from './contracts';

import { AmadeusFlightProvider } from './amadeus-provider';
import { DuffelFlightProvider } from './duffel-provider';
import { MockFlightProvider } from './mock-flight-provider';
import { HotelbedsProvider } from './hotelbeds-provider';
import { MockHotelProvider } from './mock-hotel-provider';
import { MockBookingProvider } from './mock-booking-provider';
import { StripePaymentProvider } from './stripe-provider';
import { MockPaymentProvider } from './mock-payment-provider';
import { SendGridNotificationProvider } from './sendgrid-provider';
import { MockNotificationProvider } from './mock-notification-provider';

export function createFlightProvider(): FlightSearchProvider {
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) {
    return new AmadeusFlightProvider();
  }
  if (process.env.DUFFEL_ACCESS_TOKEN) {
    return new DuffelFlightProvider();
  }
  return new MockFlightProvider();
}

export function createHotelProvider(): HotelSearchProvider {
  if (process.env.HOTELBEDS_API_KEY && process.env.HOTELBEDS_SECRET) {
    return new HotelbedsProvider();
  }
  return new MockHotelProvider();
}

export function createBookingProvider(): BookingProvider {
  return new MockBookingProvider();
}

export function createPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider();
  }
  return new MockPaymentProvider();
}

export function createNotificationProvider(): NotificationProvider {
  if (process.env.SENDGRID_API_KEY) {
    return new SendGridNotificationProvider();
  }
  return new MockNotificationProvider();
}
