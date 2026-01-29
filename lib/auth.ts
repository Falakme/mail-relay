import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { AdminSession } from './types';

const SESSION_COOKIE_NAME = 'falak_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function validateSiteKey(key: string): Promise<boolean> {
  const siteKey = process.env.SITE_KEY;
  if (!siteKey) {
    console.error('[Auth] SITE_KEY not configured in environment');
    return false;
  }
  return key === siteKey;
}

export async function createSession(): Promise<string> {
  const payload: AdminSession = {
    authenticated: true,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  return signSessionPayload(payload);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
    domain: undefined, // Allow browser to set domain based on current origin
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }

  return verifySessionToken(sessionCookie.value);
}

export function getSessionFromRequest(request: NextRequest): AdminSession | null {
  // Try to get session from Authorization header first (for cross-origin requests)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return verifySessionToken(token);
  }
  
  return null;
}

function getSiteKeyOrThrow(): string {
  const siteKey = process.env.SITE_KEY;
  if (!siteKey) {
    throw new Error('SITE_KEY not configured');
  }
  return siteKey;
}

function signSessionPayload(payload: AdminSession): string {
  const siteKey = getSiteKeyOrThrow();
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', siteKey).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifySessionToken(token: string): AdminSession | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) {
      return null;
    }

    const siteKey = getSiteKeyOrThrow();
    const expected = createHmac('sha256', siteKey).update(body).digest('base64url');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (signatureBuf.length !== expectedBuf.length) {
      return null;
    }
    if (!timingSafeEqual(signatureBuf, expectedBuf)) {
      return null;
    }

    const session = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSession;
    if (session.expiresAt && session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session?.authenticated === true;
}

export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  const session = getSessionFromRequest(request);
  return session?.authenticated === true;
}
