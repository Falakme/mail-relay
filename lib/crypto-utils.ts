import { createHash } from 'crypto';

/**
 * Hash an API key using SHA-256
 * Returns a hexadecimal string
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(plainKey: string, hash: string): boolean {
  return hashApiKey(plainKey) === hash;
}
