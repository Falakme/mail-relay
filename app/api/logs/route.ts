import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAuthenticatedFromRequest } from '@/lib/auth';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    try {
      const logs = await convex.query(api.emailLogs.getEmailLogs, { limit, offset });
      
      // For now, return the count as the length of results plus offset
      // In a real app, you'd want a separate count query
      return NextResponse.json({
        success: true,
        logs,
        total: logs.length + offset,
        limit,
        offset,
      });
    } catch (dbError) {
      console.error('[API /logs] Database error:', dbError);
      // Return empty logs if database is unavailable (e.g., on Vercel serverless)
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
        limit,
        offset,
        warning: 'Database unavailable'
      });
    }
  } catch (error) {
    console.error('[API /logs] Error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Log ID is required' },
        { status: 400 }
      );
    }

    try {
      await convex.mutation(api.emailLogs.deleteEmailLog, { id: id as any });
      return NextResponse.json({ success: true, message: 'Log deleted successfully' });
    } catch (dbError) {
      console.error('[API /logs DELETE] Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete log' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /logs DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
