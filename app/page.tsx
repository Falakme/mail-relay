'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-brand-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center gap-3">
              <img 
                src="https://falakme.github.io/brand-assets/logos/core/icon.svg" 
                alt="Falak" 
                className="h-[1em] invert"
              />
              Mail Relay
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/admin"
                className="bg-white text-brand-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Admin Panel
              </Link>
              <a
                href="#test"
                className="bg-brand-accent text-white px-8 py-3 rounded-lg font-semibold hover:bg-opacity-80 transition-colors"
              >
                Test API
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* API Documentation */}
      <section className="py-16 px-4 bg-brand-accent/20 border-t border-brand-accent/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">API Documentation</h2>
          
          <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold mb-4">Send Email</h3>
            <div className="bg-brand-accent/60 border border-brand-accent/70 rounded-lg p-4 mb-4">
              <code className="text-sm">POST /api/send-mail</code>
            </div>
            <h4 className="font-medium text-foreground mb-2">Headers:</h4>
            <pre className="bg-brand-accent/60 border border-brand-accent/70 rounded-lg p-4 text-sm overflow-x-auto mb-4">
{`Authorization: Bearer fmr_your_api_key_here
Content-Type: application/json`}
            </pre>
            <h4 className="font-medium text-foreground mb-2">Request Body:</h4>
            <pre className="bg-brand-accent/60 border border-brand-accent/70 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Plain text body",
  "html": "<p>Optional HTML body</p>",
  "from": "sender@example.com",
  "senderName": "My App",
  "replyTo": "reply@example.com"
}`}
            </pre>
            <h4 className="font-medium text-foreground mt-4 mb-2">Response:</h4>
            <pre className="bg-brand-accent/60 border border-brand-accent/70 rounded-lg p-4 text-sm overflow-x-auto">
{`{
  "success": true,
  "message": "Email sent successfully via NotificationAPI",
  "provider": "notificationapi",
  "logId": "uuid-here"
}`}
            </pre>
          </div>

          <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-foreground mb-4">Check Status</h3>
            <div className="bg-brand-accent/60 border border-brand-accent/70 rounded-lg p-4 mb-4">
              <code className="text-sm">GET /api/status</code>
            </div>
            <p className="text-foreground/80">
              Returns system health, total emails sent, and rate limit status for both providers.
            </p>
          </div>
        </div>
      </section>

      {/* Test Section */}
      <section id="test" className="py-16 px-4 bg-background border-t border-brand-accent/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Test the API</h2>
          <TestEmailForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-accent text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white/70">
            © {new Date().getFullYear()} Falak.me
          </p>
        </div>
      </footer>
    </div>
  );
}

function TestEmailForm() {
  const [formData, setFormData] = useState({
    apiKey: '',
    to: '',
    subject: '',
    body: '',
    from: '',
    senderName: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${formData.apiKey}`,
        },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          body: formData.body,
          ...(formData.from && { from: formData.from }),
          ...(formData.senderName && { senderName: formData.senderName }),
        }),
      });
      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-brand-accent/40 border border-brand-accent/50 rounded-xl shadow-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-foreground mb-2">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all font-mono text-sm placeholder-foreground/40"
            placeholder="fmr_xxxxxxxxxxxx"
            required
          />
          <p className="mt-1 text-xs text-foreground/60">
            Generate an API key from the Admin Panel
          </p>
        </div>

        <div>
          <label htmlFor="to" className="block text-sm font-medium text-foreground mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            id="to"
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-foreground/40"
            placeholder="recipient@example.com"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="from" className="block text-sm font-medium text-foreground mb-2">
              From Email <span className="text-foreground/60">(optional)</span>
            </label>
            <input
              type="email"
              id="from"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-foreground/40"
              placeholder="sender@example.com"
            />
          </div>
          <div>
            <label htmlFor="senderName" className="block text-sm font-medium text-foreground mb-2">
              Sender Name <span className="text-foreground/60">(optional)</span>
            </label>
            <input
              type="text"
              id="senderName"
              value={formData.senderName}
              onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-foreground/40"
              placeholder="My App"
            />
          </div>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-foreground/40"
            placeholder="Email subject"
            required
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-foreground mb-2">
            Message Body
          </label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-brand-accent/50 bg-brand-accent/60 text-foreground focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all resize-none placeholder-foreground/40"
            placeholder="Your message..."
            required
          />
        </div>

        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              result.success
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-red-900/30 text-red-400 border border-red-800'
            }`}
          >
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/80 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </form>
    </div>
  );
}
