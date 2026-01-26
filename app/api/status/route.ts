import { NextResponse } from 'next/server';
import { getRateLimitStatus } from '@/lib/email-service';
import { getEmailLogCount } from '@/lib/database';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);

    const rateLimitStatus = getRateLimitStatus();

    // Get deliverability stats for the selected time period
    const dbPath = path.join(process.cwd(), 'data', 'mail-relay.db');
    const db = new Database(dbPath);

    // Get total emails for ALL TIME
    const allTimeTotal = db.prepare('SELECT COUNT(*) as count FROM email_logs').get() as { count: number };
    const totalEmails = allTimeTotal.count;

    // Determine grouping interval based on hours
    let groupFormat: string;
    if (hours <= 24) {
      groupFormat = '%Y-%m-%d %H:00'; // Hourly for <= 24 hours
    } else if (hours <= 168) {
      groupFormat = '%Y-%m-%d'; // Daily for <= 7 days
    } else {
      groupFormat = '%Y-W%W'; // Weekly for > 7 days
    }

    // Get stats grouped by interval
    const timeSeriesStats = db.prepare(`
      SELECT 
        strftime('${groupFormat}', timestamp) as interval,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failed
      FROM email_logs
      WHERE datetime(timestamp) >= datetime('now', '-${hours} hours')
      GROUP BY interval
      ORDER BY interval ASC
    `).all() as Array<{
      interval: string;
      total: number;
      successful: number;
      failed: number;
    }>;

    // Get overall stats for the selected period
    const overallStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failed
      FROM email_logs
      WHERE datetime(timestamp) >= datetime('now', '-${hours} hours')
    `).get() as {
      total: number;
      successful: number;
      failed: number;
    };

    db.close();

    // Calculate deliverability percentage
    const deliverabilityRate = overallStats.total > 0 
      ? Math.round((overallStats.successful / overallStats.total) * 100) 
      : 100;

    // Format interval labels for display
    const formattedStats = timeSeriesStats.map((stat) => {
      let label = stat.interval;
      if (hours <= 24) {
        // For hourly, extract just the hour
        const hour = stat.interval.split(' ')[1];
        label = hour.substring(0, 2) + ':00';
      } else if (hours <= 168) {
        // For daily, format as date
        label = stat.interval;
      } else {
        // For weekly, format as week number
        label = `Week ${stat.interval.split('W')[1]}`;
      }
      return { ...stat, label };
    });

    return NextResponse.json({
      success: true,
      status: 'healthy',
      totalEmailsSent: totalEmails,
      rateLimits: rateLimitStatus,
      deliverability: {
        period: {
          total: overallStats.total,
          successful: overallStats.successful,
          failed: overallStats.failed,
          successRate: deliverabilityRate,
        },
        timeSeries: formattedStats,
      },
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
