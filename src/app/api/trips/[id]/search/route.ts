import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { searchService } from '@/server/services/search.service';

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const result = await searchService.runSearch(session.user.id, params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.';
    const status = message === 'UNAUTHORIZED' ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
