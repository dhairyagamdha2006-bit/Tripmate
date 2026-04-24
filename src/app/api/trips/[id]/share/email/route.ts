import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { shareService } from '@/server/services/share.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = await request.json();
    await shareService.sendShareEmail(session.user.id, params.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send share email.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
