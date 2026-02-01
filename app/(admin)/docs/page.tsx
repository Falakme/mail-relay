'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function DocsPage() {
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
                <li>• <strong>Sender Name:</strong> Display name for the sender (e.g., &quot;My Service&quot;)</li>
                <li>• <strong>Sender Email:</strong> The &quot;from&quot; address (must be verified with your email provider)</li>
                <li>• <strong>Subject & Body:</strong> Email content to send</li>
                <li>• Emails route through <strong>Brevo</strong> first, then fallback to <strong>NotificationAPI</strong></li>
                <li>• Check your spam folder if the email doesn&apos;t arrive</li>
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
