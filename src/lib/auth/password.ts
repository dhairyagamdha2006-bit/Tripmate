import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const LEGACY_KEY_LENGTH = 64;
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
    return bcrypt.compare(password, passwordHash);
  }

  return verifyLegacyPassword(password, passwordHash);
}

export function hashLegacyPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, LEGACY_KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyLegacyPassword(password: string, passwordHash: string) {
  const [salt, storedHash] = passwordHash.split(':');
  if (!salt || !storedHash) {
    return false;
  }

  const hashBuffer = Buffer.from(storedHash, 'hex');
  const candidateBuffer = scryptSync(password, salt, LEGACY_KEY_LENGTH);

  if (hashBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, candidateBuffer);
}

export function needsPasswordRehash(passwordHash: string) {
  return !(passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$'));
}
