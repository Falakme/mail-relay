import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';
import { isAuthenticated, isAuthenticatedFromRequest } from '@/lib/auth';
import { 
  getApiKeys, 
  createApiKey, 
  deleteApiKey, 
  toggleApiKeyStatus, 
  updateApiKey 
} from '@/lib/database';

export const dynamic = 'force-dynamic';
import { ApiKey } from '@/lib/types';

// Generate a secure random API key
function generateApiKey(): string {
  return 'fmr_' + randomBytes(24).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedViaCookie = await isAuthenticated();
    const authenticatedViaHeader = isAuthenticatedFromRequest(request);
    const authenticated = authenticatedViaCookie || authenticatedViaHeader;
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKeys = getApiKeys();
    // Mask the actual keys for security
    const maskedKeys = apiKeys.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' + key.key.substring(key.key.length - 4),
    }));

    return NextResponse.json({ success: true, apiKeys: maskedKeys });
  } catch (error) {
    console.error('[API /api-keys GET] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const apiKey: ApiKey = {
      id: uuidv4(),
      name,
      key: generatedKey,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    createApiKey(apiKey);

    // Return the full key only on creation - user must copy it now
    return NextResponse.json({ 
      success: true, 
      message: 'API key created successfully',
      apiKey: {
        ...apiKey,
        key: generatedKey, // Show full key only on creation
      }
    });
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
    const authenticated = await isAuthenticated();
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

    if (action === 'toggle') {
      const toggled = toggleApiKeyStatus(id);
      if (!toggled) {
        return NextResponse.json(
          { success: false, message: 'API key not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: 'API key status toggled' });
    }

    if (action === 'update' && updates) {
      const updated = updateApiKey(id, updates);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'API key not found or no changes made' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: 'API key updated successfully' });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
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
    const authenticated = await isAuthenticated();
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

    const deleted = deleteApiKey(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'API key deleted successfully' });
  } catch (error) {
    console.error('[API /api-keys DELETE] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
