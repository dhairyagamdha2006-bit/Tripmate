import { NextResponse } from 'next/server';
import { stripeProvider } from '@/server/integrations/stripe-provider';
import { bookingService } from '@/server/services/booking.service';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing Stripe signature.' }, { status: 400 });
  }

  try {
    const event = stripeProvider.constructWebhookEvent(body, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.amount_capturable_updated': {
        const paymentIntent = event.data.object as { id: string };
        await bookingService.handleSuccessfulPaymentIntent(paymentIntent.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as { id: string; last_payment_error?: { message?: string } };
        await bookingService.handlePaymentFailed(paymentIntent.id, paymentIntent.last_payment_error?.message);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 400 }
    );
  }
}
