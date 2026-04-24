import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { selectPackageSchema } from '@/lib/validations/trip';
import { bookingService } from '@/server/services/booking.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = selectPackageSchema.parse(body);
    const booking = await bookingService.selectPackage(session.user.id, params.id, parsed.packageId);
    return NextResponse.json({ ok: true, booking });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to select package.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
