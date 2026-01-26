// Types for Falak Mail Relay

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  senderName?: string;
  replyTo?: string;
}

export interface EmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  sender: string;
  status: 'success' | 'failed' | 'fallback';
  provider: 'notificationapi' | 'brevo';
  apiKeyId?: string;
  apiKeyName?: string;
  errorMessage?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  provider?: 'notificationapi' | 'brevo';
  logId?: string;
}

export interface AdminSession {
  authenticated: boolean;
  expiresAt?: number;
}
