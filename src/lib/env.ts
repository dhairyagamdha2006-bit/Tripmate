/**
 * Tiny helpers for reading runtime env vars with sensible fallbacks.
 * Centralising them here keeps the codebase consistent and makes the
 * `.env.example` surface easy to audit.
 */

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    'http://localhost:3000'
  );
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}
