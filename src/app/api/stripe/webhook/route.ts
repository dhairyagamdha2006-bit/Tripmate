import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { getStripe, hasStripe } from '@/lib/stripe';
import { bookingRepository } from '@/server/repositories/booking.repository';
import { tripRepository } from '@/server/repositories/trip.repository';

// Stripe requires the raw request body to verify signatures.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stripe webhook receiver.
 *
 * Verifies the signature, then reconciles booking state with whatever
 * PaymentIntent lifecycle event fired. All handlers are idempotent —
 * the same event can be redelivered safely.
 */
export async function POST(request: Request) {
  if (!hasStripe()) {
    return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.canceled':
      case 'payment_intent.payment_failed':
        await handlePaymentIntentEvent(event);
        break;
      default:
        // We only care about payment-intent events for now, but 200 OK
        // the rest so Stripe doesn't retry forever.
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook] handler failed:', err);
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentIntentEvent(event: Stripe.Event) {
  const intent = event.data.object as Stripe.PaymentIntent;
  const booking = await bookingRepository.findByPaymentIntentId(intent.id);
  if (!booking) return;

  const paymentStatus = intent.status;

  if (event.type === 'payment_intent.succeeded') {
    await bookingRepository.updateBooking(booking.id, {
      paymentStatus,
      paymentCapturedAt: new Date()
    });
    await tripRepository.createAuditLog({
      userId: booking.userId,
      tripId: booking.tripId,
      bookingId: booking.id,
      actorType: 'SYSTEM',
      action: 'stripe.payment_succeeded',
      details: { paymentIntentId: intent.id }
    });
    return;
  }

  if (event.type === 'payment_intent.canceled') {
    // Only demote the booking if we haven't already fulfilled it.
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING_FULFILLMENT') {
      await bookingRepository.updateBooking(booking.id, {
        status: 'CANCELLED',
        paymentStatus
      });
    } else {
      await bookingRepository.updateBooking(booking.id, { paymentStatus });
    }
    return;
  }

  if (event.type === 'payment_intent.payment_failed') {
    await bookingRepository.updateBooking(booking.id, {
      status: 'FAILED',
      paymentStatus
    });
    await tripRepository.createAuditLog({
      userId: booking.userId,
      tripId: booking.tripId,
      bookingId: booking.id,
      actorType: 'SYSTEM',
      action: 'stripe.payment_failed',
      details: {
        paymentIntentId: intent.id,
        lastPaymentError: intent.last_payment_error?.message ?? null
      }
    });
    return;
  }

  // amount_capturable_updated or other – simply record status.
  await bookingRepository.updateBooking(booking.id, { paymentStatus });
}
