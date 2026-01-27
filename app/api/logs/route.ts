import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAuthenticatedFromRequest } from '@/lib/auth';
import { getEmailLogs, getEmailLogCount, deleteEmailLog } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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

    const logs = getEmailLogs(limit, offset);
    const total = getEmailLogCount();

    return NextResponse.json({
      success: true,
      logs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API /logs] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const deleted = deleteEmailLog(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    console.error('[API /logs DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
