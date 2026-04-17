import { NextResponse } from 'next/server';
import { dispatchDueReminders } from '@/server/services/reminder.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel cron — dispatches booking reminders whose `scheduledFor` time
 * has passed. Protected by `CRON_SECRET` via a Bearer token (set on the
 * cron by Vercel automatically using `vercel.json`).
 *
 * GET is the default Vercel Cron calling method; we also accept POST so
 * operators can hit it manually with curl if needed.
 */
export async function GET(request: Request) {
  return dispatch(request);
}

export async function POST(request: Request) {
  return dispatch(request);
}

async function dispatch(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured.' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await dispatchDueReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[cron/reminders] dispatch failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
