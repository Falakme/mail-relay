'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [siteKey, setSiteKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check' }),
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
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
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      setIsAuthenticated(false);
    } catch {
      console.error('Logout failed');
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-brand-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2 text-3xl">
                <img 
                  src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                  alt="Falak" 
                  className="h-[1em] invert"
                />
                <h1 className="font-bold">Mail Relay</h1>
              </div>
              <p className="text-foreground/70">Admin Panel Login</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="siteKey" className="block text-sm font-medium text-foreground mb-2">
                  Site Key
                </label>
                <input
                  type="password"
                  id="siteKey"
                  value={siteKey}
                  onChange={(e) => setSiteKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-foreground/40"
                  placeholder="Enter your site key"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/30 text-red-400 px-4 py-3 rounded-lg text-sm border border-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-foreground/60 hover:text-brand-primary transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<'logs' | 'keys' | 'status'>('logs');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-brand-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 text-xl">
              <img 
                src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                alt="Falak" 
                className="h-[1em] invert"
              />
              <h1 className="font-bold">Mail Relay - Admin</h1>
            </div>
            <button
              onClick={onLogout}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-background border-b border-brand-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {(['logs', 'keys', 'status'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-foreground/60 hover:text-foreground/80'
                }`}
              >
                {tab === 'logs' && 'Email Logs'}
                {tab === 'keys' && 'API Keys'}
                {tab === 'status' && 'System Status'}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'logs' && <EmailLogsPanel />}
        {activeTab === 'keys' && <ApiKeysPanel />}
        {activeTab === 'status' && <StatusPanel />}
      </main>
    </div>
  );
}

function EmailLogsPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?limit=${limit}&offset=${page * limit}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteLog(id: string) {
    if (!confirm('Are you sure you want to delete this log?')) return;
    
    try {
      const res = await fetch('/api/logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLogs();
      }
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Email Logs</h2>
        <button
          onClick={fetchLogs}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-accent transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-foreground/60">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-foreground/60">No email logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-accent/60 border-b border-brand-accent/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-foreground/80 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-accent/30">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-accent/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {log.recipient}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.status === 'success'
                            ? 'bg-green-900/30 text-green-400 border border-green-800'
                            : log.status === 'fallback'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                            : 'bg-red-900/30 text-red-400 border border-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/80">
                      {log.apiKeyName || <span className="text-foreground/40 italic">Unknown</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-brand-accent/60 border-t border-brand-accent/50 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-foreground/70">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded border border-brand-accent/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent/50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded border border-brand-accent/50 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent/50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApiKeysPanel() {
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

  async function fetchApiKeys() {
    setLoading(true);
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      if (data.success) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      });
      const data = await res.json();

      if (data.success) {
        setNewlyCreatedKey(data.apiKey.key);
        setKeyName('');
        fetchApiKeys();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to toggle key status:', error);
    }
  }

  async function deleteKey(id: string) {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const res = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to delete key:', error);
    }
  }

  async function renameKey(id: string, newName: string) {
    try {
      const res = await fetch('/api/api-keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'update', updates: { name: newName } }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingKey(null);
        setEditName('');
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to rename key:', error);
    }
  }

  function startEditing(key: any) {
    setEditingKey(key.id);
    setEditName(key.name);
  }

  function cancelEditing() {
    setEditingKey(null);
    setEditName('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
        <button
          onClick={() => { setShowForm(!showForm); setNewlyCreatedKey(null); }}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-accent transition-colors"
        >
          {showForm ? 'Cancel' : 'Generate New Key'}
        </button>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4">
          <h4 className="font-semibold text-green-400 mb-2">
            🔑 API Key Created Successfully!
          </h4>
          <p className="text-sm text-green-400/80 mb-3">
            Copy this key now. You won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-brand-accent/60 border border-brand-accent/70 px-3 py-2 rounded text-sm font-mono break-all text-foreground">
              {newlyCreatedKey}
            </code>
            <button
              onClick={() => copyToClipboard(newlyCreatedKey)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showForm && !newlyCreatedKey && (
        <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Generate New API Key</h3>
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Key Name
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary placeholder-foreground/40"
                placeholder="e.g., Production, My App, Testing"
                required
              />
              <p className="mt-1 text-xs text-foreground/60">
                Give this key a descriptive name to identify it later
              </p>
            </div>
            {formError && (
              <div className="bg-red-900/30 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-800">
                {formError}
              </div>
            )}
            <button
              type="submit"
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/80 transition-colors"
            >
              Generate Key
            </button>
          </form>
        </div>
      )}

      {/* Keys List */}
      <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-foreground/60">Loading...</div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-foreground/60">
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Generate a key to authenticate API requests</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-accent/30">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-6 flex items-center justify-between hover:bg-brand-accent/50">
                <div className="flex-1">
                  {editingKey === key.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary text-sm placeholder-foreground/40"
                        placeholder="Key name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editName.trim()) {
                            renameKey(key.id, editName.trim());
                          } else if (e.key === 'Escape') {
                            cancelEditing();
                          }
                        }}
                      />
                      <button
                        onClick={() => editName.trim() && renameKey(key.id, editName.trim())}
                        className="px-2 py-1 text-sm text-green-400 hover:bg-green-900/30 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-2 py-1 text-sm text-foreground/60 hover:bg-brand-accent/50 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-foreground">{key.name}</h4>
                      <button
                        onClick={() => startEditing(key)}
                        className="text-foreground/60 hover:text-brand-primary transition-colors"
                        title="Rename"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full border ${
                          key.isActive
                            ? 'bg-green-900/30 text-green-400 border-green-800'
                            : 'bg-gray-800/30 text-foreground/80 border-gray-700'
                        }`}
                      >
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                  <div className="mt-1 text-sm text-foreground/70 font-mono">
                    {key.key}
                  </div>
                  <div className="mt-1 text-xs text-foreground/50">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsed && ` · Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleKeyStatus(key.id)}
                    className="px-3 py-1 text-sm border border-brand-accent/50 rounded hover:bg-brand-accent/50 transition-colors"
                  >
                    {key.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="px-3 py-1 text-sm text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPanel() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center text-foreground/60">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">System Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Status */}
        <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-2">
            System Health
          </h3>
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${
                status?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-2xl font-bold text-foreground capitalize">
              {status?.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Total Emails */}
        <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-2">
            Total Emails Sent
          </h3>
          <span className="text-2xl font-bold text-foreground">
            {status?.totalEmailsSent || 0}
          </span>
        </div>

        {/* Last Updated */}
        <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow p-6">
          <h3 className="text-sm font-medium text-foreground/70 uppercase tracking-wider mb-2">
            Last Updated
          </h3>
          <span className="text-lg text-foreground">
            {status?.timestamp ? new Date(status.timestamp).toLocaleString() : '-'}
          </span>
        </div>
      </div>

      {/* Rate Limit Status */}
      <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Provider Rate Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NotificationAPI */}
          <div className="border border-brand-accent/50 rounded-lg p-4 bg-brand-accent/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">NotificationAPI</h4>
              <span
                className={`px-2 py-1 text-xs rounded-full border ${
                  status?.rateLimits?.notificationapi?.isLimited
                    ? 'bg-red-900/30 text-red-400 border-red-800'
                    : 'bg-green-900/30 text-green-400 border-green-800'
                }`}
              >
                {status?.rateLimits?.notificationapi?.isLimited ? 'Rate Limited' : 'Available'}
              </span>
            </div>
            {status?.rateLimits?.notificationapi?.isLimited && (
              <p className="text-sm text-foreground/70">
                Backoff until:{' '}
                {new Date(status.rateLimits.notificationapi.backoffUntil).toLocaleString()}
              </p>
            )}
          </div>

          {/* Brevo */}
          <div className="border border-brand-accent/50 rounded-lg p-4 bg-brand-accent/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-foreground">Brevo</h4>
              <span
                className={`px-2 py-1 text-xs rounded-full border ${
                  status?.rateLimits?.brevo?.isLimited
                    ? 'bg-red-900/30 text-red-400 border-red-800'
                    : 'bg-green-900/30 text-green-400 border-green-800'
                }`}
              >
                {status?.rateLimits?.brevo?.isLimited ? 'Rate Limited' : 'Available'}
              </span>
            </div>
            {status?.rateLimits?.brevo?.isLimited && (
              <p className="text-sm text-foreground/70">
                Backoff until:{' '}
                {new Date(status.rateLimits.brevo.backoffUntil).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={fetchStatus}
          className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/80 transition-colors"
        >
          Refresh Status
        </button>
      </div>
    </div>
  );
}
