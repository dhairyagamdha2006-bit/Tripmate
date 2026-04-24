import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { bookingService } from '@/server/services/booking.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const booking = await bookingService.syncAfterPayment(session.user.id, params.id, body);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync payment state.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
