'use client';

import { useState, useEffect } from 'react';
import { Activity, Mail, TrendingUp, Server, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getAuthHeaders, readSessionCache, writeSessionCache, formatTimestamp } from '@/lib/admin-utils';

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeInterval, setTimeInterval] = useState<'1h' | '24h' | '7d' | '30d' | '90d' | 'custom'>('24h');
  const [customDays, setCustomDays] = useState(7);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus({ force: true }), 30000);
    return () => clearInterval(interval);
  }, [timeInterval, customDays]);

  async function fetchStatus({ force = false }: { force?: boolean } = {}) {
    try {
      let hours = 24;
      if (timeInterval === '1h') hours = 1;
      else if (timeInterval === '24h') hours = 24;
      else if (timeInterval === '7d') hours = 168;
      else if (timeInterval === '30d') hours = 720;
      else if (timeInterval === '90d') hours = 2160;
      else if (timeInterval === 'custom') hours = customDays * 24;

      const cacheKey = `/api/status?hours=${hours}`;
      const cached = readSessionCache<any>(cacheKey);
      if (cached && !force) {
        setStatus(cached);
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/status?hours=${hours}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      writeSessionCache(cacheKey, data);
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Status</h2>
        <Button onClick={() => fetchStatus()} size="sm" variant="outline">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Status */}
        <Card className="border-l-4" style={{ borderLeftColor: status?.status === 'healthy' ? 'rgb(52, 211, 153)' : 'rgb(239, 68, 68)' }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-muted-foreground" />
              <CardDescription>System Health</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  status?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-destructive'
                }`}
              />
              <span className="text-3xl font-bold capitalize">
                {status?.status || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Emails */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-muted-foreground" />
              <CardDescription>Total Emails Sent</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              {status?.totalEmailsSent?.toLocaleString() || 0}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={20} className="text-muted-foreground" />
                <CardTitle>Deliverability Stats</CardTitle>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-primary">
                  {status?.deliverability?.period?.successRate || 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  success rate
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {timeInterval === 'custom' ? `Last ${customDays} day${customDays !== 1 ? 's' : ''}` : `Last ${timeInterval === '1h' ? '1 hour' : timeInterval === '24h' ? '24 hours' : timeInterval === '7d' ? '7 days' : timeInterval === '30d' ? '30 days' : '90 days'}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['1h', '24h', '7d', '30d', '90d'] as const).map((interval) => (
                <Button
                  key={interval}
                  onClick={() => setTimeInterval(interval)}
                  variant={timeInterval === interval ? 'default' : 'outline'}
                  size="sm"
                >
                  {interval}
                </Button>
              ))}
              <Button
                onClick={() => setTimeInterval('custom')}
                variant={timeInterval === 'custom' ? 'default' : 'outline'}
                size="sm"
              >
                Custom
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom Days Input */}
          {timeInterval === 'custom' && (
            <div className="p-4 bg-muted rounded-lg border">
              <div className="flex items-center gap-3">
                <Label htmlFor="customDays" className="font-semibold">Days:</Label>
                <Input
                  type="number"
                  id="customDays"
                  min="1"
                  step="1"
                  value={customDays}
                  onChange={(e) => {
                    const val = Math.max(1, Math.floor(Number(e.target.value) || 1));
                    setCustomDays(val);
                  }}
                  className="w-24"
                />
                <Button
                  onClick={() => setCustomDays(7)}
                  variant="outline"
                  size="sm"
                >
                  Reset to 7
                </Button>
              </div>
            </div>
          )}

          {status?.deliverability?.timeSeries && status.deliverability.timeSeries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4 border">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Sent</div>
                <div className="text-2xl font-bold">{status.deliverability.period.total.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">Successful</div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{status.deliverability.period.successful.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">Failed</div>
                <div className="text-2xl font-bold text-destructive">{status.deliverability.period.failed.toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 bg-muted/30 rounded-lg border-2 border-dashed">
              <Mail size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium">No deliverability data available yet</p>
              <p className="text-sm mt-1">Send some emails to see statistics here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limit Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server size={20} className="text-muted-foreground" />
            <CardTitle>Provider Rate Limits</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* NotificationAPI */}
            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status?.rateLimits?.notificationapi?.isLimited ? 'bg-destructive' : 'bg-emerald-400'}`} />
                  <h4 className="font-semibold">NotificationAPI</h4>
                </div>
                <Badge
                  variant={
                    status?.rateLimits?.notificationapi?.isLimited
                      ? 'destructive'
                      : 'default'
                  }
                >
                  {status?.rateLimits?.notificationapi?.isLimited ? 'Rate Limited' : 'Available'}
                </Badge>
              </div>
              {status?.rateLimits?.notificationapi?.isLimited ? (
                <p className="text-sm text-muted-foreground">
                  Backoff until: <span className="font-medium text-foreground">{formatTimestamp(status.rateLimits.notificationapi.backoffUntil)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Operating normally
                </p>
              )}
            </div>

            {/* Brevo */}
            <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status?.rateLimits?.brevo?.isLimited ? 'bg-destructive' : 'bg-emerald-400'}`} />
                  <h4 className="font-semibold">Brevo</h4>
                </div>
                <Badge
                  variant={
                    status?.rateLimits?.brevo?.isLimited
                      ? 'destructive'
                      : 'default'
                  }
                >
                  {status?.rateLimits?.brevo?.isLimited ? 'Rate Limited' : 'Available'}
                </Badge>
              </div>
              {status?.rateLimits?.brevo?.isLimited ? (
                <p className="text-sm text-muted-foreground">
                  Backoff until: <span className="font-medium text-foreground">{formatTimestamp(status.rateLimits.brevo.backoffUntil)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Operating normally
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
