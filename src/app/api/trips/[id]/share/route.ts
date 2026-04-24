import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { shareService } from '@/server/services/share.service';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as { action?: 'create' | 'revoke'; shareId?: string; note?: string; expiresAt?: string | null };

    if (body.action === 'revoke') {
      if (!body.shareId) {
        return NextResponse.json({ ok: false, error: 'shareId is required.' }, { status: 400 });
      }
      await shareService.revokeShare(session.user.id, body.shareId);
      return NextResponse.json({ ok: true });
    }

    const share = await shareService.createShare(session.user.id, params.id, body);
    return NextResponse.json({ ok: true, share });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to manage share link.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
