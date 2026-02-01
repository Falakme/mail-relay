'use client';

import { useState, useEffect, Fragment } from 'react';
import { Info, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAuthHeaders, readSessionCache, writeSessionCache, clearSessionCacheByPrefix, formatTimestamp } from '@/lib/admin-utils';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mail-relay:logsPerPage');
      return saved ? Number(saved) : 20;
    }
    return 20;
  });
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [keyIdCache, setKeyIdCache] = useState<Record<string, string>>({});
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'timestamp' | 'recipient' | 'status' | 'provider' | 'apiKey'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const cache = await fetchApiKeysForCache();
      await fetchLogs(cache);
    };
    loadData();
  }, [page, limit]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mail-relay:logsPerPage', String(limit));
    }
  }, [limit]);

  async function fetchApiKeysForCache(): Promise<Record<string, string>> {
    try {
      const cacheKey = '/api/api-keys';
      const cached = readSessionCache<{ success: boolean; apiKeys?: any[] }>(cacheKey);
      if (cached?.success && cached.apiKeys) {
        const cache: Record<string, string> = {};
        cached.apiKeys.forEach((key: any) => {
          cache[key.keyId] = key.name;
        });
        setKeyIdCache(cache);
        return cache;
      }

      const res = await fetch('/api/api-keys', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.apiKeys) {
        writeSessionCache(cacheKey, data);
        const cache: Record<string, string> = {};
        data.apiKeys.forEach((key: any) => {
          cache[key.keyId] = key.name;
        });
        setKeyIdCache(cache);
        return cache;
      }
    } catch (error) {
      console.error('Failed to fetch API keys for cache:', error);
    }
    return {};
  }

  async function fetchLogs(cache?: Record<string, string>, { force = false }: { force?: boolean } = {}) {
    setLoading(true);
    try {
      const cacheKey = `/api/logs?limit=${limit}&offset=${page * limit}`;
      const cached = readSessionCache<{ success: boolean; logs?: any[]; total?: number }>(cacheKey);
      if (cached?.success && cached.logs && !force) {
        const enrichedLogs = cached.logs.map((log: any) => {
          if (log.metadata?.apiKeyId) {
            const keyName = (cache || keyIdCache)[log.metadata.apiKeyId] || 'Unknown';
            return { ...log, keyName };
          }
          return log;
        });
        setLogs(enrichedLogs);
        setTotal(cached.total ?? 0);
        return;
      }

      const res = await fetch(`/api/logs?limit=${limit}&offset=${page * limit}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        writeSessionCache(cacheKey, data);
        const enrichedLogs = data.logs.map((log: any) => {
          if (log.metadata?.apiKeyId) {
            const keyName = (cache || keyIdCache)[log.metadata.apiKeyId] || 'Unknown';
            return { ...log, keyName };
          }
          return log;
        });
        setLogs(enrichedLogs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteLog(id: string) {
    setConfirmDialog({
      message: 'Are you sure you want to delete this log?',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/logs', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id }),
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success) {
            clearSessionCacheByPrefix('/api/logs?');
            const cache = await fetchApiKeysForCache();
            fetchLogs(cache, { force: true });
          }
        } catch (error) {
          console.error('Failed to delete log:', error);
        }
        setConfirmDialog(null);
      }
    });
  }

  async function deleteSelectedLogs() {
    if (selectedLogs.size === 0) return;
    setConfirmDialog({
      message: `Delete ${selectedLogs.size} selected log(s)?`,
      onConfirm: async () => {
        try {
          for (const id of selectedLogs) {
            await fetch('/api/logs', {
              method: 'DELETE',
              headers: getAuthHeaders(),
              body: JSON.stringify({ id }),
              credentials: 'include',
            });
          }
          setSelectedLogs(new Set());
          clearSessionCacheByPrefix('/api/logs?');
          const cache = await fetchApiKeysForCache();
          fetchLogs(cache, { force: true });
        } catch (error) {
          console.error('Failed to delete logs:', error);
        }
        setConfirmDialog(null);
      }
    });
  }

  function toggleSelectLog(id: string) {
    const newSelected = new Set(selectedLogs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLogs(newSelected);
  }

  function toggleSelectAll() {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set());
    } else {
      setSelectedLogs(new Set(logs.map(log => log._id)));
    }
  }

  function handleSort(column: 'timestamp' | 'recipient' | 'status' | 'provider' | 'apiKey') {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }

  const sortedLogs = [...logs].sort((a, b) => {
    let compareA: any;
    let compareB: any;

    switch (sortBy) {
      case 'timestamp':
        compareA = new Date(a.timestamp).getTime();
        compareB = new Date(b.timestamp).getTime();
        break;
      case 'recipient':
        compareA = a.to.toLowerCase();
        compareB = b.to.toLowerCase();
        break;
      case 'status':
        compareA = a.status;
        compareB = b.status;
        break;
      case 'provider':
        compareA = a.provider;
        compareB = b.provider;
        break;
      case 'apiKey':
        compareA = (a.keyName || 'Unknown').toLowerCase();
        compareB = (b.keyName || 'Unknown').toLowerCase();
        break;
      default:
        return 0;
    }

    if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Email Logs</h1>
          <div className="flex gap-2">
            {selectedLogs.size > 0 && (
              <Button
                onClick={deleteSelectedLogs}
                variant="destructive"
                size="sm"
              >
                <Trash2 size={16} className="mr-2" />
                Delete {selectedLogs.size}
              </Button>
            )}
            <Button
              onClick={() => fetchLogs()}
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          {loading ? (
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading...
            </CardContent>
          ) : logs.length === 0 ? (
            <CardContent className="pt-6 text-center text-muted-foreground">
              No email logs found
            </CardContent>
          ) : (
            <>
              {/* Pagination Top */}
              {totalPages > 1 && (
                <div className="border-b p-6 pt-0 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {total === 0 ? 0 : page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pageSize">Per page:</Label>
                      <Select value={String(limit)} onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(0);
                      }}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Page Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft size={16} className="mr-1" />
                        First
                      </Button>
                      <div className="flex flex-wrap gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i;
                          if (totalPages > 5 && page > 2) {
                            pageNum = page - 2 + i;
                          }
                          if (pageNum >= totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-8 p-0"
                            >
                              {pageNum + 1}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                        variant="outline"
                        size="sm"
                      >
                        Last
                        <ChevronRight size={16} className="ml-1" />
                      </Button>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Page {page + 1} of {totalPages}
                    </span>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center pr-0">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedLogs.size === logs.length && logs.length > 0}
                            onCheckedChange={toggleSelectAll}
                            ref={(el) => {
                              if (el && selectedLogs.size > 0 && selectedLogs.size < logs.length) {
                                const input = el.querySelector('input');
                                if (input) input.indeterminate = true;
                              }
                            }}
                          />
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer pl-0" onClick={() => handleSort('timestamp')}>
                        Timestamp {sortBy === 'timestamp' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('recipient')}>
                        Recipient {sortBy === 'recipient' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                        Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('apiKey')}>
                        API Key {sortBy === 'apiKey' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((log) => (
                      <Fragment key={log._id}>
                        <TableRow>
                          <TableCell className="w-16 text-center pr-0">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={selectedLogs.has(log._id)}
                                onCheckedChange={() => toggleSelectLog(log._id)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm pl-0">{formatTimestamp(log.timestamp)}</TableCell>
                          <TableCell className="text-sm">{log.to}</TableCell>
                          <TableCell className="text-sm max-w-xs truncate">{log.subject}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === 'success'
                                  ? 'default'
                                  : log.status === 'fallback'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.keyName || <span className="text-muted-foreground italic">Unknown</span>}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  const newExpanded = new Set(expandedLogs);
                                  if (newExpanded.has(log._id)) {
                                    newExpanded.delete(log._id);
                                  } else {
                                    newExpanded.add(log._id);
                                  }
                                  setExpandedLogs(newExpanded);
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <Info size={16} />
                              </Button>
                              <Button
                                onClick={() => deleteLog(log._id)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedLogs.has(log._id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/50">
                              <div className="space-y-3 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">Message ID</div>
                                    <div className="font-mono text-xs mt-1">{log.messageId}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">Provider</div>
                                    <div className="mt-1">{log.provider}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">Status</div>
                                    <div className="capitalize mt-1">{log.status}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">To</div>
                                    <div className="mt-1">{log.to}</div>
                                  </div>
                                  <div className="col-span-2">
                                    <div className="text-xs font-medium text-muted-foreground uppercase">Subject</div>
                                    <div className="mt-1">{log.subject}</div>
                                  </div>
                                  {log.metadata && (
                                    <>
                                      {log.metadata.senderName && (
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground uppercase">Sender Name</div>
                                          <div className="mt-1">{log.metadata.senderName}</div>
                                        </div>
                                      )}
                                      {log.metadata.replyTo && (
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground uppercase">Reply To</div>
                                          <div className="mt-1">{log.metadata.replyTo}</div>
                                        </div>
                                      )}
                                      {log.metadata.bodyLength !== undefined && (
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground uppercase">Body Length</div>
                                          <div className="mt-1">{log.metadata.bodyLength} chars</div>
                                        </div>
                                      )}
                                      {log.metadata.htmlLength !== undefined && (
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground uppercase">HTML Length</div>
                                          <div className="mt-1">{log.metadata.htmlLength} chars</div>
                                        </div>
                                      )}
                                      {log.metadata.apiKeyId && (
                                        <div>
                                          <div className="text-xs font-medium text-muted-foreground uppercase">API Key ID</div>
                                          <div className="font-mono text-xs mt-1">{log.metadata.apiKeyId}</div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {log.error && (
                                    <div className="col-span-2">
                                      <div className="text-xs font-medium text-destructive uppercase">Error</div>
                                      <div className="text-destructive/80 mt-1 text-sm">{log.error}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Bottom */}
              {totalPages > 1 && (
                <div className="border-t p-6 pb-0 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {total === 0 ? 0 : page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="pageSize2">Per page:</Label>
                      <Select value={String(limit)} onValueChange={(val) => {
                        setLimit(Number(val));
                        setPage(0);
                      }}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={true} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
