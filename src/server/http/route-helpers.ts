import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { fail, ok } from '@/lib/utils/api';
import { getOptionalCurrentUser } from '@/lib/auth/session';

export async function requireApiUser() {
  const user = await getOptionalCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(ok(data), init);
}

export function jsonError(error: string, status = 400, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json(fail(error, fieldErrors), { status });
}

export function fieldErrorsFromZod(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) && entry[1].length > 0
    )
  );
}
