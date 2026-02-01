'use client';

import { useState, useEffect, Fragment } from 'react';
import { Info, Trash2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ThemeToggle } from '@/components/theme-toggle';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return { 'Content-Type': 'application/json' };
  }
  
  const token = localStorage.getItem('adminToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

type SessionCacheEntry<T> = {
  data: T;
};

const SESSION_CACHE_PREFIX = 'mail-relay:';

function buildSessionCacheKey(key: string): string {
  return `${SESSION_CACHE_PREFIX}${key}`;
}

const pageCache = new Map<string, SessionCacheEntry<any>>();

function readSessionCache<T>(key: string): T | null {
  try {
    const cacheKey = buildSessionCacheKey(key);
    const entry = pageCache.get(cacheKey);
    return entry?.data ?? null;
  } catch {
    return null;
  }
}

function writeSessionCache<T>(key: string, data: T): void {
  try {
    const cacheKey = buildSessionCacheKey(key);
    const entry: SessionCacheEntry<T> = { data };
    pageCache.set(cacheKey, entry);
  } catch {
    // Ignore cache errors
  }
}

function clearSessionCacheByPrefix(prefix: string): void {
  try {
    const fullPrefix = buildSessionCacheKey(prefix);
    const keysToDelete: string[] = [];
    for (const [key] of pageCache) {
      if (key.startsWith(fullPrefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(k => pageCache.delete(k));
  } catch {
    // Ignore cache errors
  }
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [siteKey, setSiteKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      checkAuth();
    }
  }, [isClient]);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'check' }),
        credentials: 'include',
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', siteKey }),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        if (data.token && typeof window !== 'undefined') {
          localStorage.setItem('adminToken', data.token);
        }
        await checkAuth();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'include',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
      }
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
      setIsAuthenticated(false);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img 
                  src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                  alt="Falak.me" 
                  className="h-8 dark:invert"
                />
                <CardTitle className="text-3xl">Mail Relay</CardTitle>
              </div>
              <CardDescription className="text-base">Admin Panel Login</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteKey">Site Key</Label>
                  <Input
                    type="password"
                    id="siteKey"
                    value={siteKey}
                    onChange={(e) => setSiteKey(e.target.value)}
                    placeholder="Enter your site key"
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#000030] to-[#0000C0] hover:from-[#000020] hover:to-[#0000B0] text-white"
                  size="lg"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'logs' | 'keys' | 'status' | 'docs'>('logs');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  useEffect(() => {
    const path = window.location.pathname.slice(1) as 'logs' | 'keys' | 'status' | 'docs' | '';
    if (path && ['logs', 'keys', 'status', 'docs'].includes(path)) {
      setActiveTab(path);
    } else {
      setActiveTab('logs');
    }
  }, []);

  const handleTabChange = (tab: 'logs' | 'keys' | 'status' | 'docs') => {
    setActiveTab(tab);
    window.history.pushState({}, '', `/${tab}`);
    setMobileNavOpen(false);
  };

  function showConfirm(message: string, onConfirm: () => void) {
    setConfirmDialog({ message, onConfirm });
  }

  function handleConfirm() {
    if (confirmDialog) {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-[#000030] to-[#0000C0] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <img 
                src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                alt="Falak" 
                className="h-6 invert"
              />
              Mail Relay
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileNavOpen((s) => !s)}
                className="sm:hidden p-2 hover:bg-white/20 rounded-md transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <Button
                onClick={onLogout}
                className="bg-white text-blue-600 hover:bg-slate-100 font-medium"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div className="sm:hidden border-b bg-gradient-to-r from-[#000030]/5 to-[#0000C0]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col gap-1">
            {(['logs', 'keys', 'status', 'docs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`w-full text-left py-3 px-3 rounded-md font-medium transition-colors ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-[#000030]/20 to-[#0000C0]/20 text-foreground' 
                    : 'hover:bg-gradient-to-r hover:from-[#000030]/10 hover:to-[#0000C0]/10'
                }`}
              >
                {tab === 'logs' && 'Email Logs'}
                {tab === 'keys' && 'API Keys'}
                {tab === 'status' && 'System Status'}
                {tab === 'docs' && 'Documentation'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as any)} className="border-0">
            <TabsList className="bg-transparent w-full justify-start rounded-none border-0 p-0">
              <TabsTrigger value="logs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#000030]/20 data-[state=active]:to-[#0000C0]/20">
                Email Logs
              </TabsTrigger>
              <TabsTrigger value="keys" className="rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#000030]/20 data-[state=active]:to-[#0000C0]/20">
                API Keys
              </TabsTrigger>
              <TabsTrigger value="status" className="rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#000030]/20 data-[state=active]:to-[#0000C0]/20">
                System Status
              </TabsTrigger>
              <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-transparent data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#000030]/20 data-[state=active]:to-[#0000C0]/20">
                Documentation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'logs' && <EmailLogsPanel showConfirm={showConfirm} />}
        {activeTab === 'keys' && <ApiKeysPanel showConfirm={showConfirm} />}
        {activeTab === 'status' && <StatusPanel />}
        {activeTab === 'docs' && <DocsPanel />}
      </main>

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
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function EmailLogsPanel({ showConfirm }: { showConfirm: (message: string, onConfirm: () => void) => void }) {
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
    showConfirm('Are you sure you want to delete this log?', async () => {
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
    });
  }

  async function deleteSelectedLogs() {
    if (selectedLogs.size === 0) return;
    showConfirm(`Delete ${selectedLogs.size} selected log(s)?`, async () => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Logs</h2>
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
              <div className="border-b p-6 space-y-4">
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLogs.size === logs.length && logs.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('timestamp')}>
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
                        <TableCell>
                          <Checkbox
                            checked={selectedLogs.has(log._id)}
                            onChange={() => toggleSelectLog(log._id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{formatTimestamp(log.timestamp)}</TableCell>
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
                            {log.status}
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
              <div className="border-t p-6 space-y-4">
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
  );
}

function ApiKeysPanel({ showConfirm }: { showConfirm: (message: string, onConfirm: () => void) => void }) {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys({ force = false }: { force?: boolean } = {}) {
    setLoading(true);
    try {
      const cacheKey = '/api/api-keys';
      const cached = readSessionCache<{ success: boolean; apiKeys?: any[] }>(cacheKey);
      if (cached?.success && cached.apiKeys && !force) {
        setApiKeys(cached.apiKeys);
        return;
      }

      const res = await fetch('/api/api-keys', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        writeSessionCache(cacheKey, data);
        setApiKeys(data.apiKeys);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setNewlyCreatedKey(null);

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: keyName }),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        setNewlyCreatedKey(data.apiKey.key);
        setKeyName('');
        clearSessionCacheByPrefix('/api/api-keys');
        fetchApiKeys({ force: true });
      } else {
        setFormError(data.message);
      }
    } catch {
      setFormError('Failed to create API key');
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleKeyStatus(id: string) {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, action: 'toggle' }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        clearSessionCacheByPrefix('/api/api-keys');
        fetchApiKeys({ force: true });
      }
    } catch (error) {
      console.error('Failed to toggle key status:', error);
    }
  }

  async function deleteKey(id: string) {
    showConfirm('Are you sure you want to delete this API key?', async () => {
      try {
        const res = await fetch('/api/api-keys', {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id }),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) {
          clearSessionCacheByPrefix('/api/api-keys');
          fetchApiKeys({ force: true });
        }
      } catch (error) {
        console.error('Failed to delete key:', error);
      }
    });
  }

  async function rotateKey(id: string, name: string) {
    showConfirm(`Rotate the key "${name}"? The old key will no longer work.`, async () => {
      try {
        const res = await fetch('/api/api-keys', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id, action: 'rotate' }),
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.apiKey?.key) {
          setNewlyCreatedKey(data.apiKey.key);
          clearSessionCacheByPrefix('/api/api-keys');
          fetchApiKeys({ force: true });
        }
      } catch (error) {
        console.error('Failed to rotate key:', error);
      }
    });
  }

  async function renameKey(id: string, newName: string) {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, action: 'update', updates: { name: newName } }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setEditingKey(null);
        setEditName('');
        clearSessionCacheByPrefix('/api/api-keys');
        fetchApiKeys({ force: true });
      }
    } catch (error) {
      console.error('Failed to rename key:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <Button
          onClick={() => { setShowForm(!showForm); setNewlyCreatedKey(null); }}
        >
          {showForm ? 'Cancel' : 'Generate New Key'}
        </Button>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <Alert>
          <AlertDescription>
            <h4 className="font-semibold mb-2">
              🔑 API Key Created Successfully!
            </h4>
            <p className="text-sm mb-3">
              Copy this key now. You won&apos;t be able to see it again.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                {newlyCreatedKey}
              </code>
              <Button
                onClick={() => copyToClipboard(newlyCreatedKey)}
                size="sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Create Form */}
      {showForm && !newlyCreatedKey && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Production, My App, Testing"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Give this key a descriptive name to identify it later
                </p>
              </div>
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Button type="submit">Generate Key</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <Card>
        {loading ? (
          <CardContent className="pt-6 text-center text-muted-foreground">
            Loading...
          </CardContent>
        ) : apiKeys.length === 0 ? (
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Generate a key to authenticate API requests</p>
          </CardContent>
        ) : (
          <div className="divide-y">
            {apiKeys.map((key) => (
              <div key={key._id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    {editingKey === key._id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Key name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editName.trim()) {
                              renameKey(key._id, editName.trim());
                            }
                          }}
                        />
                        <Button
                          onClick={() => editName.trim() && renameKey(key._id, editName.trim())}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingKey(null)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold">{key.name}</h4>
                          <Button
                            onClick={() => {
                              setEditingKey(key._id);
                              setEditName(key.name);
                            }}
                            variant="ghost"
                            size="sm"
                          >
                            ✏️
                          </Button>
                          <Badge
                            variant={key.isActive ? 'default' : 'secondary'}
                          >
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          ID: {key.keyId}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Usage: {key.usageCount} requests
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatTimestamp(key.createdAt)}
                          {key.lastUsed && ` · Last used: ${formatTimestamp(key.lastUsed)}`}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => toggleKeyStatus(key._id)}
                      variant="outline"
                      size="sm"
                    >
                      {key.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      onClick={() => rotateKey(key._id, key.name)}
                      variant="outline"
                      size="sm"
                    >
                      Rotate
                    </Button>
                    <Button
                      onClick={() => deleteKey(key._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusPanel() {
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
      <h2 className="text-2xl font-bold">System Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  status?.status === 'healthy' ? 'bg-emerald-400' : 'bg-destructive'
                }`}
              />
              <span className="text-2xl font-bold capitalize">
                {status?.status || 'Unknown'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Emails */}
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Emails Sent</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {status?.totalEmailsSent || 0}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Deliverability Stats</CardTitle>
              <div className="text-3xl font-bold text-primary mt-2">
                {status?.deliverability?.period?.successRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
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
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Label htmlFor="customDays">Days:</Label>
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
                  Reset
                </Button>
              </div>
            </div>
          )}

          {status?.deliverability?.timeSeries && status.deliverability.timeSeries.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</div>
                <div className="text-xl font-bold">{status.deliverability.period.total}</div>
              </div>
              <div className="bg-emerald-600/25 rounded-lg p-3">
                <div className="text-xs text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Successful</div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{status.deliverability.period.successful}</div>
              </div>
              <div className="bg-destructive/25 rounded-lg p-3">
                <div className="text-xs text-destructive uppercase tracking-wider mb-1">Failed</div>
                <div className="text-xl font-bold text-destructive">{status.deliverability.period.failed}</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No deliverability data available yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rate Limit Status */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NotificationAPI */}
            <div className="bg-muted rounded-lg py-4 px-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">NotificationAPI</h4>
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
              {status?.rateLimits?.notificationapi?.isLimited && (
                <p className="text-sm text-muted-foreground mt-2">
                  Backoff until: {formatTimestamp(status.rateLimits.notificationapi.backoffUntil)}
                </p>
              )}
            </div>

            {/* Brevo */}
            <div className="bg-muted rounded-lg py-4 px-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Brevo</h4>
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
              {status?.rateLimits?.brevo?.isLimited && (
                <p className="text-sm text-muted-foreground mt-2">
                  Backoff until: {formatTimestamp(status.rateLimits.brevo.backoffUntil)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={() => fetchStatus()}>
          Refresh Status
        </Button>
      </div>
    </div>
  );
}

function DocsPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [testSenderName, setTestSenderName] = useState('Test Sender');
  const [testSenderEmail, setTestSenderEmail] = useState('');
  const [testSubject, setTestSubject] = useState('Test Email');
  const [testBody, setTestBody] = useState('This is a test email from Falak Mail Relay.');
  const [testLoading, setTestLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  async function sendTestEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!testEmail || !testSenderEmail || !apiKey) {
      setTestMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setTestLoading(true);
    setTestMessage(null);

    try {
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          body: testBody,
          html: `<p>${testBody.replace(/\n/g, '<br>')}</p>`,
          senderName: testSenderName,
          from: testSenderEmail,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestMessage({ type: 'success', text: 'Test email sent successfully!' });
        setTestEmail('');
        setTestSubject('Test Email');
        setTestBody('This is a test email from Falak Mail Relay.');
      } else {
        setTestMessage({ type: 'error', text: data.message || 'Failed to send test email' });
      }
    } catch (error) {
      setTestMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setTestLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* API Documentation */}
      <section>
        <h2 className="text-2xl font-bold mb-4">API Documentation</h2>
        <Card>
          <CardHeader>
            <CardTitle>Send Email Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Endpoint Overview */}
            <div>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm mb-4 overflow-x-auto">
                <div className="text-primary font-bold">POST</div>
                <div>{typeof window !== 'undefined' ? window.location.origin : ''}/api/send-mail</div>
              </div>

              <h4 className="font-semibold mb-2">Authentication</h4>
              <p className="text-muted-foreground text-sm mb-3">
                Include your API key in the Authorization header using the Bearer scheme:
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                Authorization: Bearer &lt;your-api-key&gt;
              </div>
            </div>

            {/* Request Body */}
            <div>
              <h4 className="font-semibold mb-2">Request Body</h4>
              <p className="text-muted-foreground text-sm mb-3">JSON payload with the following fields:</p>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email body in HTML</p>",
  "senderName": "Your App",
  "senderEmail": "noreply@example.com"
}`}</pre>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <span className="font-mono text-sm text-primary">to</span>
                  <span className="text-sm text-muted-foreground"> (required): Recipient email address</span>
                </div>
                <div>
                  <span className="font-mono text-sm text-primary">subject</span>
                  <span className="text-sm text-muted-foreground"> (required): Email subject line</span>
                </div>
                <div>
                  <span className="font-mono text-sm text-primary">html</span>
                  <span className="text-sm text-muted-foreground"> (required): Email body in HTML format</span>
                </div>
                <div>
                  <span className="font-mono text-sm text-primary">senderName</span>
                  <span className="text-sm text-muted-foreground"> (optional): Display name of sender</span>
                </div>
                <div>
                  <span className="font-mono text-sm text-primary">senderEmail</span>
                  <span className="text-sm text-muted-foreground"> (optional): Email address to send from</span>
                </div>
              </div>
            </div>

            {/* Example cURL */}
            <div>
              <h4 className="font-semibold mb-2">Example Request (cURL)</h4>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`curl -X POST https://your-domain.com/api/send-mail \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "to": "user@example.com",
    "subject": "Hello!",
    "html": "<p>This is a test email</p>",
    "senderName": "My App",
    "senderEmail": "noreply@myapp.com"
  }'`}</pre>
              </div>
            </div>

            {/* Response */}
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <p className="text-muted-foreground text-sm mb-3">On success:</p>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto mb-3">
                <pre>{`{
  "success": true,
  "message": "Email sent successfully"
}`}</pre>
              </div>
              <p className="text-muted-foreground text-sm mb-3">On error:</p>
              <div className="bg-muted rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre>{`{
  "success": false,
  "message": "Error description"
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Test Email Form */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Test Email</h2>
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Send a test email to verify your setup is working correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-2">How to use:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>API Key:</strong> Paste an active API key (only for testing, not included in request)</li>
                <li>• <strong>Recipient Email:</strong> Where to send the test email</li>
                <li>• <strong>Sender Name:</strong> Display name for the sender (e.g., "My Service")</li>
                <li>• <strong>Sender Email:</strong> The "from" address (must be verified with your email provider)</li>
                <li>• <strong>Subject & Body:</strong> Email content to send</li>
                <li>• Emails route through <strong>Brevo</strong> first, then fallback to <strong>NotificationAPI</strong></li>
                <li>• Check your spam folder if the email doesn't arrive</li>
              </ul>
            </div>

            <form onSubmit={sendTestEmail} className="space-y-4">
              {/* API Key Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Button
                    type="button"
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    variant="ghost"
                    size="sm"
                  >
                    {showApiKeyInput ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <Input
                  type={showApiKeyInput ? 'text' : 'password'}
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  required
                />
              </div>

              {/* Sender Name */}
              <div className="space-y-2">
                <Label htmlFor="senderName">Sender Name</Label>
                <Input
                  type="text"
                  id="senderName"
                  value={testSenderName}
                  onChange={(e) => setTestSenderName(e.target.value)}
                  placeholder="Your App Name"
                  required
                />
              </div>

              {/* Sender Email */}
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Sender Email</Label>
                <Input
                  type="email"
                  id="senderEmail"
                  value={testSenderEmail}
                  onChange={(e) => setTestSenderEmail(e.target.value)}
                  placeholder="noreply@example.com"
                  required
                />
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="testEmail">Recipient Email</Label>
                <Input
                  type="email"
                  id="testEmail"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  required
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="testSubject">Subject</Label>
                <Input
                  type="text"
                  id="testSubject"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  placeholder="Email subject"
                  required
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="testBody">Body (Plain Text)</Label>
                <Textarea
                  id="testBody"
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  placeholder="Email body text"
                  rows={5}
                  required
                />
              </div>

              {/* Messages */}
              {testMessage && (
                <Alert variant={testMessage.type === 'success' ? 'default' : 'destructive'}>
                  <AlertDescription>{testMessage.text}</AlertDescription>
                </Alert>
              )}

              {/* Send Button */}
              <Button
                type="submit"
                disabled={testLoading}
                className="w-full"
                size="lg"
              >
                {testLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
