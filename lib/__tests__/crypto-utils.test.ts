import { afterEach, describe, expect, it } from 'vitest';
import { hashApiKey, verifyApiKey } from '../crypto-utils';

describe('crypto-utils', () => {
  const originalSiteKey = process.env.SITE_KEY;

  afterEach(() => {
    if (originalSiteKey) {
      process.env.SITE_KEY = originalSiteKey;
    } else {
      delete process.env.SITE_KEY;
    }
  });

  it('hashes deterministically with the same SITE_KEY', () => {
    process.env.SITE_KEY = 'test-site-key';
    const first = hashApiKey('fmr_test_key');
    const second = hashApiKey('fmr_test_key');
    expect(first).toBe(second);
  });

  it('verifies API key against its hash', () => {
    process.env.SITE_KEY = 'test-site-key';
    const hash = hashApiKey('fmr_test_key');
    expect(verifyApiKey('fmr_test_key', hash)).toBe(true);
    expect(verifyApiKey('fmr_other_key', hash)).toBe(false);
  });

  it('throws when SITE_KEY is missing', () => {
    delete process.env.SITE_KEY;
    expect(() => hashApiKey('fmr_test_key')).toThrow('SITE_KEY');
  });
});
