import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { addDays } from '@/lib/utils/date';

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'tripmate_session';
const SESSION_DAYS = 30;

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.SESSION_COOKIE_SECURE === 'true',
    expires: expiresAt
  };
}

export async function createSessionForUser(userId: string) {
  const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
  const expiresAt = addDays(new Date(), SESSION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  return { token, expiresAt };
}

export function applySessionCookie(token: string, expiresAt: Date) {
  const store = cookies();
  store.set(SESSION_COOKIE, token, getSessionCookieOptions(expiresAt));
}

export function clearSessionCookie() {
  const store = cookies();
  store.set(SESSION_COOKIE, '', getSessionCookieOptions(new Date(0)));
}

export async function destroyCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.deleteMany({ where: { token } });
  clearSessionCookie();
}

export async function getOptionalCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getOptionalCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
