# Mail Relay - Agent Development Guide

This file contains essential information for agentic coding agents working on the mail-relay project.

## Build/Test/Lint Commands

### Development
```bash
# Start development server (default port 3000)
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run ESLint
bun run lint
```

### Testing
**Note**: This project currently has no testing framework configured. When adding tests:
- Set up Jest or Vitest for unit tests
- Use React Testing Library for component tests
- Mock Convex database operations
- Add test scripts to package.json

## Tech Stack Overview

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Convex (serverless backend)
- **Styling**: Tailwind CSS v4
- **Email Providers**: Brevo (primary), NotificationAPI (fallback)
- **Package Manager**: Bun (bun.lock present)
- **Authentication**: HMAC-SHA256 API keys + session-based admin

## Code Style Guidelines

### Import Organization
```typescript
// External dependencies first
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Internal imports with @/ alias
import { EmailRequest, EmailLog } from '@/lib/types';
import { sendEmail } from '@/lib/email-service';
import { api } from '@/convex/_generated/api';
```

### TypeScript Conventions
- Use strict TypeScript mode (already enabled)
- Define interfaces in `lib/types.ts` for shared types
- Use optional properties (`property?: string`) for non-required fields
- Export all interfaces used across files
- Use union types for status fields: `'success' | 'failed' | 'fallback'`

### Naming Conventions
- **Files**: kebab-case (`send-mail/route.ts`, `email-service.ts`)
- **Variables**: camelCase (`apiKey`, `emailRequest`)
- **Functions**: camelCase with descriptive verbs (`validateApiKey`, `sendEmail`)
- **Types**: PascalCase interfaces (`EmailRequest`, `ApiKey`)
- **Constants**: UPPER_SNAKE_CASE for environment keys (`SITE_KEY`)
- **Database Collections**: camelCase in schema (`emailLogs`, `apiKeys`)

### API Route Structure
Follow this pattern for all API routes:
```typescript
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication/Validation
    // 2. Input validation
    // 3. Business logic
    // 4. Return response
  } catch (error) {
    console.error('[API /route-name] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling Patterns
- Always wrap route handlers in try-catch blocks
- Log errors with context: `console.error('[CONTEXT] Error:', error);`
- Return consistent error responses: `{ success: false, message: string }`
- Use appropriate HTTP status codes (400, 401, 500)
- Don't fail requests for non-critical operations (usage counts, etc.)

### Database Operations (Convex)
```typescript
// Query pattern
const result = await convex.query(api.collectionName.methodName, { params });

// Mutation pattern  
await convex.mutation(api.collectionName.methodName, { params });

// Always include proper indexes in schema.ts
.index("by_field", ["fieldName"])
```

### Security Requirements
- **API Keys**: Use HMAC-SHA256 hashing via `hashApiKey()` utility
- **Authentication**: Support both `Bearer <key>` and raw key formats
- **Validation**: Validate email format with regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Session Management**: Use Next.js sessions for admin panel
- **Never**: Log sensitive data like API keys or passwords

### Component Guidelines
- Use `'use client'` directive for client-side components
- Import React hooks as needed
- Use localStorage for client-side token storage
- Follow Tailwind CSS v4 patterns (utility classes)
- Use Lucide React icons consistently

### Environment Variables
Required environment variables:
```env
SITE_KEY=your-secure-site-key
NOTIFICATIONAPI_CLIENT_ID=your-client-id
NOTIFICATIONAPI_CLIENT_SECRET=your-client-secret
BREVO_API_KEY=your-brevo-api-key
DEFAULT_FROM_EMAIL=noreply@alerts.falak.me
CONVEX_DEPLOYMENT=dev:your-deployment-id
NEXT_PUBLIC_CONVEX_URL=https://your-deployment-id.convex.cloud
```

## Project Structure Rules

### Directory Organization
```
app/
├── api/           # API routes (method-specific folders)
├── layout.tsx     # Root layout
├── page.tsx       # Main dashboard
└── globals.css    # Global styles

lib/               # Shared utilities and types
├── types.ts       # ALL TypeScript interfaces
├── email-service.ts
├── auth.ts
└── convex-client.ts

convex/            # Backend functions
├── schema.ts      # Database schema with indexes
└── *.ts          # Individual collection operations
```

### File Placement Rules
- API routes: `app/api/[feature-name]/route.ts`
- Shared types: `lib/types.ts` (centralized)
- Business logic: `lib/[feature]-service.ts`
- Convex operations: `convex/[collection].ts`
- Client components: Use `'use client'` directive

## Development Workflow

### When Adding New Features
1. Define interfaces in `lib/types.ts` first
2. Create Convex schema with proper indexes
3. Implement database operations in `convex/[collection].ts`
4. Create API route following standard pattern
5. Add authentication/security validation
6. Implement frontend with proper error handling

### Code Review Checklist
- [ ] TypeScript interfaces defined and exported
- [ ] Proper error handling in all routes
- [ ] Security validation (API key, input validation)
- [ ] ESLint passes (`bun run lint`)
- [ ] Consistent naming conventions
- [ ] Database indexes added for queries
- [ ] No console.log statements left (use console.error for errors)

## Important Architectural Decisions

### Email Provider Strategy
- Always try Brevo first, fallback to NotificationAPI
- Log all attempts with provider and status
- Handle rate limiting gracefully
- Never expose provider credentials in logs

### Authentication Flow
- API endpoints: Bearer token or raw API key
- Admin panel: Session-based authentication
- API keys: Hashed using site key as salt
- Always validate keys before processing requests

### Database Patterns
- Use Convex for all data persistence
- Add indexes for frequently queried fields
- Use mutation helpers for atomic operations
- Include timestamps for all records

## Linting and Quality

The project uses ESLint with Next.js configuration:
- Run `bun run lint` before committing
- Fix all linting errors
- No Prettier configured (consider adding)
- TypeScript strict mode enforced

## Common Patterns to Avoid

- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't commit sensitive data or API keys
- ❌ Don't skip input validation in API routes
- ❌ Don't use console.log for debugging (remove before commit)
- ❌ Don't access environment variables on client-side (use NEXT_PUBLIC_ prefix)
- ❌ Don't create API routes without proper error handling

## Testing Guidelines (When Added)

- Unit tests for utility functions in `lib/`
- API route tests with mocked Convex client
- Component tests with React Testing Library
- Integration tests for email sending flows
- Mock external email providers in tests