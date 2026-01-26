import { NextResponse } from 'next/server';
import { getRateLimitStatus } from '@/lib/email-service';
import { getEmailLogCount } from '@/lib/database';

export async function GET() {
  try {
    const rateLimitStatus = getRateLimitStatus();
    const totalEmails = getEmailLogCount();

    return NextResponse.json({
      success: true,
      status: 'healthy',
      totalEmailsSent: totalEmails,
      rateLimits: rateLimitStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /status] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
