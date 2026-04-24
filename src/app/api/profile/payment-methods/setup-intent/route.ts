import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { profileService } from '@/server/services/profile.service';

export async function POST() {
  try {
    const session = await requireSession();
    const setupIntent = await profileService.createSetupIntent(session.user.id);
    return NextResponse.json({
      ok: true,
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create setup intent.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
