import { NextRequest, NextResponse } from 'next/server';
import { validateSiteKey, createSession, setSessionCookie, clearSessionCookie, isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, siteKey } = body;

    if (action === 'login') {
      if (!siteKey || typeof siteKey !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Site key is required' },
          { status: 400 }
        );
      }

      const isValid = await validateSiteKey(siteKey);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: 'Invalid site key' },
          { status: 401 }
        );
      }

      const token = await createSession();
      await setSessionCookie(token);

      return NextResponse.json({ success: true, message: 'Logged in successfully' });
    }

    if (action === 'logout') {
      await clearSessionCookie();
      return NextResponse.json({ success: true, message: 'Logged out successfully' });
    }

    if (action === 'check') {
      const authenticated = await isAuthenticated();
      return NextResponse.json({ authenticated });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /auth] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
