import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, isAuthenticatedFromRequest } from '@/lib/auth';
import { getRateLimitStatus } from '@/lib/email-service';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

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
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const rateLimitStatus = getRateLimitStatus();

    try {
      // Get logs with a high limit to get recent stats
      const logs = await convex.query(api.emailLogs.getEmailLogs, { 
        limit: 10000, 
        offset: 0 
      }) as any[];

      // Filter logs by time period
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => new Date(log.timestamp) >= cutoffTime);

      // Calculate stats
      const totalEmails = logs.length;
      const successful = recentLogs.filter(log => log.status === 'success').length;
      const failed = recentLogs.filter(log => log.status !== 'success').length;
      const deliverabilityRate = recentLogs.length > 0 
        ? Math.round((successful / recentLogs.length) * 100) 
        : 100;

      // Group logs by hour or day based on time period
      const timeSeriesMap = new Map<string, { total: number; successful: number; failed: number }>();
      
      recentLogs.forEach(log => {
        const logTime = new Date(log.timestamp);
        let key: string;
        
        if (hours <= 24) {
          // Hourly
          key = logTime.toISOString().substring(0, 13) + ':00';
        } else if (hours <= 168) {
          // Daily
          key = logTime.toISOString().substring(0, 10);
        } else {
          // Weekly
          const weekNum = Math.floor((logTime.getTime() - new Date(logTime.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
          key = `Week ${weekNum}`;
        }

        if (!timeSeriesMap.has(key)) {
          timeSeriesMap.set(key, { total: 0, successful: 0, failed: 0 });
        }
        
        const stats = timeSeriesMap.get(key)!;
        stats.total += 1;
        if (log.status === 'success') {
          stats.successful += 1;
        } else {
          stats.failed += 1;
        }
      });

      // Convert to array and format
      const timeSeries = Array.from(timeSeriesMap.entries())
        .map(([label, stats]) => ({
          label,
          ...stats,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      return NextResponse.json({
        success: true,
        status: 'healthy',
        totalEmailsSent: totalEmails,
        rateLimits: rateLimitStatus,
        deliverability: {
          period: {
            total: recentLogs.length,
            successful,
            failed,
            successRate: deliverabilityRate,
          },
          timeSeries,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('[API /status] Database error:', dbError);
      // Return basic status if database is unavailable
      return NextResponse.json({
        success: true,
        status: 'degraded',
        totalEmailsSent: 0,
        rateLimits: rateLimitStatus,
        deliverability: {
          period: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 100,
          },
          timeSeries: [],
        },
        timestamp: new Date().toISOString(),
        warning: 'Database unavailable',
      });
    }
  } catch (error) {
    console.error('[API /status] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'unhealthy',
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
