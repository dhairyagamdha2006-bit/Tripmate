import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { tripService } from '@/server/services/trip.service';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const trip = await tripService.createTrip(session.user.id, body);
    return NextResponse.json({ ok: true, tripId: trip.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create trip.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
