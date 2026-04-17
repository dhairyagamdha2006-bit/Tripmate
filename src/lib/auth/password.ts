/**
 * Password hashing with bcrypt + lazy migration from legacy scrypt hashes.
 *
 * New accounts: bcrypt with cost 12.
 *
 * Legacy hashes (created with the original `salt:hex(scrypt)` format) are
 * verified using the legacy verifier. After a successful legacy login the
 * caller (Credentials authorize) rehashes the password with bcrypt and
 * persists it, so users transparently migrate on their next sign-in.
 */
import bcrypt from 'bcryptjs';
import { scryptSync, timingSafeEqual } from 'node:crypto';

const BCRYPT_COST = 12;
const LEGACY_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  // Bcrypt hashes always start with `$2a$`, `$2b$`, or `$2y$`.
  if (passwordHash.startsWith('$2')) {
    return bcrypt.compare(password, passwordHash);
  }
  return verifyLegacyScryptPassword(password, passwordHash);
}

export function isLegacyHash(passwordHash: string): boolean {
  return !passwordHash.startsWith('$2');
}

function verifyLegacyScryptPassword(password: string, passwordHash: string): boolean {
  const [salt, storedHex] = passwordHash.split(':');
  if (!salt || !storedHex) return false;

  let stored: Buffer;
  try {
    stored = Buffer.from(storedHex, 'hex');
  } catch {
    return false;
  }
  if (stored.length !== LEGACY_KEY_LENGTH) return false;

  const candidate = scryptSync(password, salt, LEGACY_KEY_LENGTH);
  return timingSafeEqual(stored, candidate);
}
