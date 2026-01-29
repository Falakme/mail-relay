import { createHmac } from 'crypto';

/**
 * Get the site key for hashing (used as salt/secret)
 * Falls back to a default if not set (should be configured in production)
 */
function getSiteKey(): string {
  const siteKey = process.env.SITE_KEY;
  if (!siteKey) {
    throw new Error('SITE_KEY is not configured');
  }
  return siteKey;
}

/**
 * Hash an API key using HMAC-SHA256 with site key as salt
 * Returns a hexadecimal string
 */
export function hashApiKey(key: string): string {
  const siteKey = getSiteKey();
  return createHmac('sha256', siteKey).update(key).digest('hex');
}

/**
 * Verify an API key against its hash
 */
export function verifyApiKey(plainKey: string, hash: string): boolean {
  return hashApiKey(plainKey) === hash;
}
