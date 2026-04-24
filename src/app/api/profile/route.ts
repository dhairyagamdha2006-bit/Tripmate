import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { profileService } from '@/server/services/profile.service';

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const profile = await profileService.upsertTravelerProfile(session.user.id, body);
    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save traveler profile.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
