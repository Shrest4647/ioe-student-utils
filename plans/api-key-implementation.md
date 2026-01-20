# API Key Implementation Plan

## Overview
Implementation of API Key functionality for admin users to enable programmatic access to the application's REST API for scripts and bots.

## Current Architecture Analysis

### Project Structure
- **Framework**: Next.js 16 with App Router
- **Authentication**: Better Auth with Elysia integration
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Shadcn UI + Tailwind CSS 4
- **State Management**: TanStack Query + Eden Client

### Current Admin System
- **Roles**: `user` and `admin` (defined in user.role field)
- **Authorization**: Custom Elysia plugins (`auth: true`, `role: "admin"`, `adminOrOwner: true`)
- **Dashboard**: `/dashboard` routes with nested admin sections
- **Navigation**: Shadcn NavigationMenu in navbar component

## Implementation Plan

### Phase 1: Backend Setup (Better Auth Integration)

#### 1.1 Better Auth Configuration
- Add `apiKey` plugin to `/src/server/better-auth/config.ts`
- Add `apiKeyClient` plugin to `/src/lib/auth-client.ts`
- Run database migration to add API key tables

#### 1.2 Database Schema
Better Auth automatically creates `apikey` table with fields:
- `id`, `name`, `key` (hashed), `userId`
- `permissions`, `metadata`, `expiresAt`
- `rateLimit*`, `remaining`, `refill*`
- `enabled`, `createdAt`, `updatedAt`

#### 1.3 API Routes
Create `/src/server/elysia/routes/api-keys.ts` with endpoints:
- `GET /api/keys` - List user's API keys (auth required)
- `POST /api/keys` - Create new API key (auth required)
- `GET /api/keys/:id` - Get specific API key details
- `PUT /api/keys/:id` - Update API key (adminOrOwner)
- `DELETE /api/keys/:id` - Delete API key (adminOrOwner)
- `POST /api/keys/:id/regenerate` - Regenerate API key

### Phase 2: Frontend Implementation

#### 2.1 Navigation Integration
- Add "API Keys" link to dashboard navigation in `/src/components/common/navbar.tsx`
- Position between "Settings" and "Sign Out" for logical flow

#### 2.2 Page Structure
Create pages under `/src/app/(protected)/dashboard/api-keys/`:
- `page.tsx` - Main API keys management page
- `new/page.tsx` - Create new API key form
- `[id]/page.tsx` - Edit/view specific API key

#### 2.3 UI Components
Following existing Shadcn patterns:
- **API Key Card**: Display key info with copy button
- **Create Form**: Name, expiration (days), permissions, metadata
- **Key List**: Table with status, usage, expiration
- **Permission Selector**: Multi-select for resource permissions

### Phase 3: Key Features Implementation

#### 3.1 Key Generation & Display
- Generate secure keys using Better Auth's built-in generator
- Show full key **only once** during creation
- Display partial key (e.g., `sk_test_...abc123`) in lists
- Implement "Copy to clipboard" functionality

#### 3.2 Expiration Management
- Allow users to set custom expiration (1-365 days)
- Show expiration status clearly in UI
- Send notifications before keys expire
- Auto-cleanup expired keys

#### 3.3 Permissions System
Use Better Auth's built-in permissions:
```typescript
// Default permissions structure
{
  "users": ["read", "write"],
  "scholarships": ["read", "write"],
  "universities": ["read"],
  "recommendations": ["read", "write", "delete"]
}
```

#### 3.4 Rate Limiting & Usage
- Built-in rate limiting per key
- Display usage statistics
- Show remaining requests if configured
- Rate limit warnings in UI

### Phase 4: Security & Authorization

#### 4.1 Access Control
- Users can only manage their own API keys
- Admins can manage all API keys (role-based)
- API key authentication for external scripts/bots

#### 4.2 Key Security
- Keys are hashed in database (Better Auth default)
- HTTPS-only transmission
- Audit logging for key operations
- Key rotation capabilities

### Phase 5: Integration Points

#### 5.1 Script Authentication
Create API key authentication middleware:
```typescript
// Example for external scripts
const response = await fetch('https://yourapp.com/api/scholarships', {
  headers: {
    'x-api-key': 'sk_live_...',
    'Content-Type': 'application/json'
  }
});
```

#### 5.2 Documentation
- API key usage examples
- Integration guides for popular languages
- Rate limiting documentation
- Permission reference

## File Structure Changes

```
src/
├── server/
│   ├── better-auth/
│   │   ├── config.ts (modify)
│   │   └── server.ts (check for integration)
│   └── elysia/routes/api-keys.ts (new)
├── lib/
│   └── auth-client.ts (modify)
├── components/common/
│   └── navbar.tsx (modify)
└── app/(protected)/dashboard/api-keys/
    ├── page.tsx (new)
    ├── new/page.tsx (new)
    └── [id]/page.tsx (new)
```

## Implementation Order

1. **Backend First**: Add Better Auth plugins, migrate DB, create API routes
2. **Navigation**: Add API keys link to navbar
3. **Main Page**: Implement list view with create button
4. **Create Form**: Build API key creation interface
5. **Detail View**: Add individual key management
6. **Security**: Add API key authentication to existing endpoints
7. **Testing**: Verify script/bot access works
8. **Documentation**: Create usage guides

## Key Features Summary

✅ **One-time Display**: Full key shown only on creation
✅ **Copy Functionality**: Easy clipboard copying
✅ **Custom Expiration**: User-defined TTL (1-365 days)
✅ **Rate Limiting**: Built-in request throttling
✅ **Permissions**: Granular access control
✅ **Admin Override**: Admins can manage all keys
✅ **Audit Trail**: Track key creation/usage
✅ **Security**: Hashed storage, HTTPS only

## Technical Requirements

### Dependencies
- Better Auth API Key plugin (built-in)
- No additional packages required
- Uses existing Shadcn UI components

### Security Considerations
- API keys hashed in database
- Custom expiration times
- Rate limiting per key
- Role-based access control
- HTTPS enforcement

### Migration Strategy
- Use `bun run db:generate` to create migration
- Use `bun run db:migrate` to apply changes
- Test with `make ready` command

This plan leverages Better Auth's powerful API Key plugin while following existing architectural patterns in the codebase.