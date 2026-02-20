# Architecture

**Analysis Date:** 2026-02-20

## Pattern Overview

**Overall:** Full-stack Next.js 16 with Elysia API layer and Drizzle ORM

**Key Characteristics:**
- Next.js App Router with route groups for authentication
- Elysia.js as API layer with Eden Treaty for type-safe client calls
- Better Auth for authentication (sessions, API keys, OAuth, 2FA)
- Drizzle ORM v1 with PostgreSQL and relational queries
- MCP (Model Context Protocol) server for AI tool integration
- TanStack Query for client-side data fetching
- Shadcn UI components built on Radix UI

## Layers

**Presentation Layer:**
- Purpose: UI rendering and user interaction
- Location: `src/app/`, `src/components/`
- Contains: Page routes, layouts, React components, client hooks
- Depends on: API layer (via Eden client), auth client
- Used by: End users, web browsers

**API Layer:**
- Purpose: Backend business logic and HTTP endpoints
- Location: `src/server/elysia/`
- Contains: Route handlers, authorization plugins, validation schemas
- Depends on: Database layer, Better Auth, S3, external services
- Used by: Frontend (via Eden), MCP server, external API consumers

**Data Layer:**
- Purpose: Database schema, queries, and data persistence
- Location: `src/server/db/`
- Contains: Schema definitions, relations, database connection
- Depends on: PostgreSQL
- Used by: API layer, MCP server

**Authentication Layer:**
- Purpose: User identity and access control
- Location: `src/server/better-auth/`, `src/lib/auth-client.ts`
- Contains: Auth configuration, session management, API keys
- Depends on: Database (user, session tables)
- Used by: API layer (plugins), frontend (auth client)

**MCP Layer:**
- Purpose: AI agent tool integration
- Location: `src/server/mcp/`
- Contains: Tool definitions, server handler, auth verification
- Depends on: Database, Better Auth (API keys)
- Used by: AI agents, MCP clients

## Data Flow

**Frontend API Calls:**

1. Client component calls a hook (e.g., `useScholarships`)
2. Hook uses `apiClient` (Eden Treaty) to type-safely call API
3. Request routed to `src/app/api/[[...slugs]]/route.ts`
4. Elysia instance handles request, applies plugins (CORS, auth, rate-limit)
5. Route handler executes business logic, queries database via Drizzle
6. Response returned as JSON: `{ success: boolean, data?: T, error?: string }`
7. TanStack Query caches response on client

**MCP Tool Calls:**

1. AI agent sends JSON-RPC request to `/api/mcp/[transport]`
2. MCP handler verifies API key authentication
3. Registered tool function executes, queries database
4. Response returned as JSON-RPC result

**Authentication Flow:**

1. User signs in via Better Auth (`signIn()` from `authClient`)
2. Session cookie stored, validated by `authorizationPlugin` in Elysia
3. Protected routes require `{ auth: true }` or `{ sessionAuth: true }` decorator
4. API key authentication via `x-api-key` header for programmatic access
5. Role-based access via `{ role: "admin" }` decorator

**State Management:**
- Client: TanStack Query (React Query) for server state
- Server: Database (PostgreSQL) as single source of truth
- Auth: Better Auth sessions (HTTP-only cookies) + API keys

## Key Abstractions

**Elysia Routes:**
- Purpose: Encapsulates HTTP endpoint logic with type-safe schemas
- Examples: `src/server/elysia/routes/scholarships.ts`, `src/server/elysia/routes/colleges.ts`
- Pattern: `.get()`/`.post()`/`.put()`/`.delete()` with TypeBox validation

**Drizzle Relations:**
- Purpose: Define relationships between tables for nested queries
- Examples: `src/server/db/relations.ts`
- Pattern: `defineRelations(schema, (r) => ({ user: { accounts: r.many.account(...) } }))`

**MCP Tools:**
- Purpose: Expose database operations to AI agents
- Examples: `src/server/mcp/tools/scholarships.ts`, `src/server/mcp/tools/colleges.ts`
- Pattern: Register tool with name, description, and handler function

**Auth Plugins:**
- Purpose: Reusable authentication and authorization decorators
- Examples: `src/server/elysia/plugins/authorization.ts`, `src/server/elysia/plugins/better-auth.ts`
- Pattern: Elysia plugin with `.macro()` for route-level decorators

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation to any URL
- Responsibilities: Root layout, providers (QueryClient), global components (Navbar, Toaster)

**API Router:**
- Location: `src/app/api/[[...slugs]]/route.ts`
- Triggers: Any request to `/api/*` (except `/api/auth/*` and `/api/mcp/*`)
- Responsibilities: Elysia instance with all route handlers, exports HTTP verb handlers

**MCP Server:**
- Location: `src/app/api/mcp/[transport]/route.ts`
- Triggers: MCP client connection requests
- Responsibilities: MCP handler for AI tool integration

**Better Auth Endpoints:**
- Location: Mounted via `src/server/better-auth/server.ts` in Elysia
- Triggers: Auth flows (sign in, sign out, callbacks)
- Responsibilities: `/api/auth/*` routes for authentication

## Error Handling

**Strategy:** Structured error responses with try/catch in route handlers

**Patterns:**
- API responses always include `{ success: boolean, error?: string }`
- Elysia `onError` hook logs errors (`better-auth` plugin)
- TanStack Query throws errors that can be caught by components
- Authorization failures return 401/403 status codes
- Database errors caught and logged, generic error returned to client

## Cross-Cutting Concerns

**Logging:** Console logging in development, Vercel Analytics in production

**Validation:** TypeBox schemas in Elysia routes, Zod in environment config

**Authentication:** Better Auth with sessions, API keys, OAuth (GitHub, Slack), 2FA, magic links

**Authorization:** Role-based (`user`/`admin`) and resource ownership checks via `authorizationPlugin`

**Rate Limiting:** In-memory Map-based rate limiting in `src/server/middleware/rate-limit.ts` (TODO: Redis for production)

**File Storage:** AWS S3 via `@aws-sdk/client-s3`, presigned URLs for uploads/downloads

---

*Architecture analysis: 2026-02-20*
