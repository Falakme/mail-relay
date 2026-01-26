import notificationapi from 'notificationapi-node-server-sdk';
import * as Brevo from '@getbrevo/brevo';
import { v4 as uuidv4 } from 'uuid';
import { EmailRequest, EmailLog, SendEmailResponse } from './types';
import { logEmail } from './database';

// Rate limit tracking (in-memory, resets on server restart)
const rateLimitState = {
  notificationapi: {
    lastError: 0,
    backoffUntil: 0,
  },
  brevo: {
    lastError: 0,
    backoffUntil: 0,
  },
};

const BACKOFF_DURATION = 60000; // 1 minute backoff after rate limit

function isRateLimited(provider: 'notificationapi' | 'brevo'): boolean {
  return Date.now() < rateLimitState[provider].backoffUntil;
}

function setRateLimited(provider: 'notificationapi' | 'brevo'): void {
  rateLimitState[provider].lastError = Date.now();
  rateLimitState[provider].backoffUntil = Date.now() + BACKOFF_DURATION;
}

// Get credentials from environment variables
function getNotificationApiCredentials(): { clientId: string; clientSecret: string } | null {
  const envClientId = process.env.NOTIFICATIONAPI_CLIENT_ID;
  const envClientSecret = process.env.NOTIFICATIONAPI_CLIENT_SECRET;
  
  if (envClientId && envClientSecret) {
    return { clientId: envClientId, clientSecret: envClientSecret };
  }

  return null;
}

function getBrevoApiKey(): string | null {
  const envKey = process.env.BREVO_API_KEY;
  if (envKey) return envKey;
  return null;
}

async function sendViaNotificationApi(email: EmailRequest): Promise<{ success: boolean; error?: string }> {
  const credentials = getNotificationApiCredentials();
  
  if (!credentials) {
    return { success: false, error: 'NotificationAPI credentials not configured' };
  }

  if (isRateLimited('notificationapi')) {
    return { success: false, error: 'NotificationAPI rate limited, in backoff period' };
  }

  try {
    notificationapi.init(credentials.clientId, credentials.clientSecret);
    
    await notificationapi.send({
      type: 'mail_relay',
      to: {
        id: email.to,
        email: email.to,
      },
      email: {
        subject: email.subject,
        html: email.html || `<p>${email.body}</p>`,
        senderName: email.senderName || 'Falak Mail Relay',
        senderEmail: email.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@alerts.falak.me',
      },
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a rate limit error
    if (errorMessage.toLowerCase().includes('rate') || 
        errorMessage.toLowerCase().includes('limit') ||
        errorMessage.toLowerCase().includes('quota')) {
      setRateLimited('notificationapi');
    }
    
    console.error('[NotificationAPI Error]:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function sendViaBrevo(email: EmailRequest): Promise<{ success: boolean; error?: string }> {
  const apiKey = getBrevoApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'Brevo API key not configured' };
  }

  if (isRateLimited('brevo')) {
    return { success: false, error: 'Brevo rate limited, in backoff period' };
  }

  try {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = email.subject;
    sendSmtpEmail.htmlContent = email.html || `<p>${email.body}</p>`;
    sendSmtpEmail.textContent = email.body;
    sendSmtpEmail.sender = { 
      name: email.senderName || 'Falak Mail Relay', 
      email: email.from || process.env.DEFAULT_FROM_EMAIL || 'noreply@alerts.falak.me' 
    };
    sendSmtpEmail.to = [{ email: email.to }];
    
    if (email.replyTo) {
      sendSmtpEmail.replyTo = { email: email.replyTo };
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a rate limit error
    if (errorMessage.toLowerCase().includes('rate') || 
        errorMessage.toLowerCase().includes('limit') ||
        errorMessage.toLowerCase().includes('quota')) {
      setRateLimited('brevo');
    }
    
    console.error('[Brevo Error]:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

export async function sendEmail(email: EmailRequest, apiKeyId?: string): Promise<SendEmailResponse> {
  const logId = uuidv4();
  const timestamp = new Date().toISOString();
  const sender = email.from || 'noreply@falak.me';

  // Try NotificationAPI first
  console.log('[Mail Relay] Attempting to send via NotificationAPI...');
  const notificationResult = await sendViaNotificationApi(email);

  if (notificationResult.success) {
    const emailLog: EmailLog = {
      id: logId,
      timestamp,
      recipient: email.to,
      subject: email.subject,
      sender,
      status: 'success',
      provider: 'notificationapi',
      apiKeyId,
    };
    logEmail(emailLog);
    console.log('[Mail Relay] Email sent successfully via NotificationAPI');
    
    return {
      success: true,
      message: 'Email sent successfully via NotificationAPI',
      provider: 'notificationapi',
      logId,
    };
  }

  // Fallback to Brevo
  console.log('[Mail Relay] NotificationAPI failed, falling back to Brevo...');
  const brevoResult = await sendViaBrevo(email);

  if (brevoResult.success) {
    const emailLog: EmailLog = {
      id: logId,
      timestamp,
      recipient: email.to,
      subject: email.subject,
      sender,
      status: 'fallback',
      provider: 'brevo',
      apiKeyId,
    };
    logEmail(emailLog);
    console.log('[Mail Relay] Email sent successfully via Brevo (fallback)');
    
    return {
      success: true,
      message: 'Email sent successfully via Brevo (fallback)',
      provider: 'brevo',
      logId,
    };
  }

  // Both failed
  const emailLog: EmailLog = {
    id: logId,
    timestamp,
    recipient: email.to,
    subject: email.subject,
    sender,
    status: 'failed',
    provider: 'notificationapi',
    apiKeyId,
    errorMessage: `NotificationAPI: ${notificationResult.error}; Brevo: ${brevoResult.error}`,
  };
  logEmail(emailLog);
  console.error('[Mail Relay] Both providers failed:', emailLog.errorMessage);

  return {
    success: false,
    message: `Failed to send email. NotificationAPI: ${notificationResult.error}; Brevo: ${brevoResult.error}`,
    logId,
  };
}

export function getRateLimitStatus() {
  return {
    notificationapi: {
      isLimited: isRateLimited('notificationapi'),
      backoffUntil: rateLimitState.notificationapi.backoffUntil,
    },
    brevo: {
      isLimited: isRateLimited('brevo'),
      backoffUntil: rateLimitState.brevo.backoffUntil,
    },
  };
}
