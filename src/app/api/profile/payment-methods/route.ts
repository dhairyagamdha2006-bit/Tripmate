import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { profileService } from '@/server/services/profile.service';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { setupIntentId: string };
    const paymentMethod = await profileService.syncSetupIntent(session.user.id, body.setupIntentId);
    return NextResponse.json({ ok: true, paymentMethod });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save payment method.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const paymentMethodId = searchParams.get('paymentMethodId');
    if (!paymentMethodId) {
      return NextResponse.json({ ok: false, error: 'paymentMethodId is required.' }, { status: 400 });
    }

    await profileService.removePaymentMethod(session.user.id, paymentMethodId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to remove payment method.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
