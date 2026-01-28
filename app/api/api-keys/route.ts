import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { isAuthenticated, isAuthenticatedFromRequest } from '@/lib/auth';
import { getConvexClient } from '@/lib/convex-client';
import { hashApiKey } from '@/lib/crypto-utils';
import { api } from '@/convex/_generated/api';

export const dynamic = 'force-dynamic';

// Generate a secure random API key
function generateApiKey(): string {
  return 'fmr_' + randomBytes(24).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const apiKeys = await convex.query(api.apiKeys.getApiKeys);
      // Don't return the key field since it's now a hash - only return metadata
      const keyMetadata = (apiKeys as any[]).map(key => ({
        _id: key._id,
        _creationTime: key._creationTime,
        name: key.name,
        isActive: key.isActive,
        createdAt: key.createdAt,
        usageCount: key.usageCount,
        lastUsed: key.lastUsed,
      }));

      return NextResponse.json({ success: true, apiKeys: keyMetadata });
    } catch (dbError) {
      console.error('[API /api-keys GET] Database error:', dbError);
      // Return empty keys if database is unavailable
      return NextResponse.json({ success: true, apiKeys: [] });
    }
  } catch (error) {
    console.error('[API /api-keys GET] Error:', error);
    return NextResponse.json(
      { success: false, message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400 }
      );
    }

    const generatedKey = generateApiKey();

    try {
      const id = await convex.mutation(api.apiKeys.createApiKey, {
        name,
        key: hashApiKey(generatedKey),
      });

      // Return the full key only on creation - user must copy it now
      return NextResponse.json({ 
        success: true, 
        message: 'API key created successfully',
        apiKey: {
          _id: id,
          name,
          key: generatedKey,
          createdAt: new Date().toISOString(),
          isActive: true,
          usageCount: 0,
        }
      });
    } catch (dbError) {
      console.error('[API /api-keys POST] Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to create API key' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /api-keys POST] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, action, updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'API key ID is required' },
        { status: 400 }
      );
    }

    try {
      if (action === 'toggle') {
        await convex.mutation(api.apiKeys.toggleApiKeyStatus, { id: id as any });
        return NextResponse.json({ success: true, message: 'API key status toggled' });
      }

      if (action === 'update' && updates) {
        await convex.mutation(api.apiKeys.updateApiKey, { id: id as any, ...updates });
        return NextResponse.json({ success: true, message: 'API key updated successfully' });
      }

      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    } catch (dbError) {
      console.error('[API /api-keys PUT] Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to update API key' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /api-keys PUT] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const convex = getConvexClient();
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'API key ID is required' },
        { status: 400 }
      );
    }

    try {
      await convex.mutation(api.apiKeys.deleteApiKey, { id: id as any });
      return NextResponse.json({ success: true, message: 'API key deleted successfully' });
    } catch (dbError) {
      console.error('[API /api-keys DELETE] Database error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete API key' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API /api-keys DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
