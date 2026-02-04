'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

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
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'logout' }),
        credentials: 'include',
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
      }
      setIsAuthenticated(false);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
      setIsAuthenticated(false);
    }
  }

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-xl">Redirecting...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/logs', label: 'Email Logs' },
    { href: '/keys', label: 'API Keys' },
    { href: '/status', label: 'System Status' },
    { href: '/docs', label: 'Documentation' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#000030]/90 to-[#0000C0]/90 backdrop-blur-lg text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/logs" className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition-opacity">
              <img 
                src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                alt="Falak" 
                className="h-6 invert drop-shadow-md"
              />
              Mail Relay
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileNavOpen((s) => !s)}
                className="sm:hidden p-2 hover:bg-white/20 rounded-md transition-colors backdrop-blur-sm"
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <Button
                onClick={handleLogout}
                className="bg-white/95 hover:bg-white text-gray-900 font-medium backdrop-blur-sm shadow-md"
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
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`w-full text-left py-3 px-3 rounded-md font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-[#000030]/20 to-[#0000C0]/20 text-foreground'
                    : 'hover:bg-gradient-to-r hover:from-[#000030]/10 hover:to-[#0000C0]/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <nav className="hidden sm:block border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 px-1 border-b-2 font-medium transition-colors ${
                  isActive(item.href)
                    ? 'border-blue-600 text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
