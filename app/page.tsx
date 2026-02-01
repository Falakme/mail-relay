'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [siteKey, setSiteKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'check' }),
        credentials: 'include',
      });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);

      if (data.authenticated) {
        router.push('/logs');
      }
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
        setIsAuthenticated(true);
        router.push('/logs');
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

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Redirecting...</div>
      </div>
    );
  }

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

        <div className="mt-4 flex justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
