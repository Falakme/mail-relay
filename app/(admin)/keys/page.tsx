'use client';

import { useState, useEffect } from 'react';
import { Key, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getAuthHeaders, readSessionCache, writeSessionCache, clearSessionCacheByPrefix, formatTimestamp } from '@/lib/admin-utils';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

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
    setConfirmDialog({
      message: 'Are you sure you want to delete this API key?',
      onConfirm: async () => {
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
        setConfirmDialog(null);
      },
    });
  }

  async function rotateKey(id: string, name: string) {
    setConfirmDialog({
      message: `Rotate the key "${name}"? The old key will no longer work.`,
      onConfirm: async () => {
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
        setConfirmDialog(null);
      },
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
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Key size={16} /> API Key Created Successfully!
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
      <Card className="py-0">
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
                            <Pencil size={16} className="mr-1" />
                            Rename
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

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <Dialog open={true} onOpenChange={() => setConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
            </DialogHeader>
            <DialogDescription>{confirmDialog.message}</DialogDescription>
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
    </div>
  );
}
