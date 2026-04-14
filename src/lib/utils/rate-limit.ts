/**
 * Simple in-memory rate limiter.
 * Uses a Map to track request counts per key.
 * Good enough for a single-instance deployment.
 * For multi-instance: replace Map with Redis via ioredis.
 */

const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request should be blocked (limit exceeded).
 * @param key     Unique key e.g. "login:1.2.3.4"
 * @param limit   Max requests allowed in the window
 * @param windowS Window size in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowS: number
): Promise<boolean> {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowS * 1000 });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;

  return false;
}
