import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email-service';
import { EmailRequest } from '@/lib/types';
import { getConvexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

// Validate API key from Authorization header
async function validateApiKey(request: NextRequest, convex: any): Promise<{ valid: boolean; keyId?: string; key?: string }> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return { valid: false };
  }

  // Support both "Bearer <key>" and just "<key>"
  const key = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const apiKey = await convex.query(api.apiKeys.getApiKeyByKey, { key });
    
    if (apiKey && apiKey.isActive) {
      return { valid: true, keyId: apiKey._id, key };
    }
  } catch (error) {
    console.error('[API /send-mail] Error validating API key:', error);
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    // Validate API key
    const { valid, key } = await validateApiKey(request, convex);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing API key. Include Authorization header.' },
        { status: 401 }
      );
    }

    // Update last used timestamp
    if (key) {
      try {
        await convex.mutation(api.apiKeys.incrementUsageCount, { key });
      } catch (error) {
        console.error('[API /send-mail] Error updating usage count:', error);
        // Don't fail the request if this fails
      }
    }

    const body = await request.json();
    
    // Validate required fields
    const { to, subject, body: emailBody, html, from, senderName, replyTo } = body;
    
    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid "to" field' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid "subject" field' },
        { status: 400 }
      );
    }

    if (!emailBody || typeof emailBody !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid "body" field' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format for "to" field' },
        { status: 400 }
      );
    }

    const emailRequest: EmailRequest = {
      to,
      subject,
      body: emailBody,
      html: html || undefined,
      from: from || undefined,
      senderName: senderName || undefined,
      replyTo: replyTo || undefined,
    };

    const result = await sendEmail(emailRequest, key || undefined);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    console.error('[API /send-mail] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Falak Mail Relay API',
      usage: 'POST /api/send-mail with Authorization header and { to, subject, body, html?, from?, senderName?, replyTo? }',
      auth: 'Include header: Authorization: Bearer <your-api-key>',
    },
    { status: 200 }
  );
}
