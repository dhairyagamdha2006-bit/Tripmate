import { randomBytes } from 'node:crypto';

export function generateOpaqueToken(byteLength = 24) {
  return randomBytes(byteLength).toString('base64url');
}

export function createPublicToken(byteLength = 18) {
  return generateOpaqueToken(byteLength);
}
