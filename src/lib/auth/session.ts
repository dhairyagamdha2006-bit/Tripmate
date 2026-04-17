import { redirect } from 'next/navigation';
import type { User } from '@prisma/client';

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

/**
 * Session helpers backed by Auth.js v5 (JWT strategy).
 *
 * The legacy `tripmate_session` cookie / `Session` table are no longer used
 * for authentication. They remain in the schema for a one-shot migration
 * window and can be dropped in a follow-up migration once all sessions
 * have naturally expired.
 */

export async function getOptionalCurrentUser(): Promise<User | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ?? null;
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getOptionalCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
