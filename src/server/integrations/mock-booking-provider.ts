import type { BookingProvider } from '@/server/integrations/contracts';
import type { BookingProviderResult, BookingRequestPayload } from '@/types/travel';

export class MockBookingProvider implements BookingProvider {
  name = 'mock-booking';

  async createBooking(input: BookingRequestPayload): Promise<BookingProviderResult> {
    const suffix = input.tripId.slice(-6).toUpperCase();

    return {
      success: true,
      confirmationNumber: `TM-${suffix}-${Date.now().toString().slice(-5)}`,
      cancellationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          type: 'FLIGHT',
          status: 'CONFIRMED',
          provider: this.name,
          providerReference: `FLT-${suffix}`,
          displayName: 'Flight reservation',
          amountCents: 0,
          currency: 'USD',
          details: { travelerName: input.travelerName }
        },
        {
          type: 'HOTEL',
          status: 'CONFIRMED',
          provider: this.name,
          providerReference: `HTL-${suffix}`,
          displayName: 'Hotel reservation',
          amountCents: 0,
          currency: 'USD',
          details: { travelerName: input.travelerName }
        }
      ]
    };
  }
}
