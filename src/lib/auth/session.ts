import { auth } from '@/auth';

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
