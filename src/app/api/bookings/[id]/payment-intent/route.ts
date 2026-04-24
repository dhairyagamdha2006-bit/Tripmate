import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { bookingService } from '@/server/services/booking.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const result = await bookingService.createPaymentIntent(session.user.id, params.id, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create payment intent.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
