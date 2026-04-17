/**
 * Provider factory.
 *
 * Reads env vars and returns the most appropriate implementation for
 * each boundary. Every service imports from here — no service should
 * instantiate a provider directly.
 *
 * Honesty rule: the *mock* providers are legitimate fallbacks for
 * local dev and preview deployments. The booking service treats any
 * provider whose name starts with `mock-` as "quote only" and marks
 * the resulting booking PENDING_FULFILLMENT rather than CONFIRMED.
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
import { ResendNotificationProvider } from './resend-provider';
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
  // We do not yet have a real booking provider wired up. Amadeus test
  // tier is search-only. Swap this when we have production credentials.
  return new MockBookingProvider();
}

export function createPaymentProvider(): PaymentProvider {
  if (process.env.STRIPE_SECRET_KEY) {
    return new StripePaymentProvider();
  }
  return new MockPaymentProvider();
}

export function createNotificationProvider(): NotificationProvider {
  if (process.env.RESEND_API_KEY) {
    return new ResendNotificationProvider();
  }
  return new MockNotificationProvider();
}
