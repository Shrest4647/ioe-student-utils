# External Integrations

**Analysis Date:** 2026-02-20

## APIs & External Services

**Email:**
- Resend - Transactional email delivery
  - SDK: `resend` package (v6.6.0)
  - Auth: `RESEND_API_KEY` environment variable
  - From address: `RESEND_FROM_EMAIL`
  - Implementation: `src/server/emails/email.tsx`
  - Templates: `src/server/emails/*.tsx` (React Email components)
  - Use cases: Email verification, magic links, OTP, password reset

**Authentication:**
- GitHub OAuth - Social authentication
  - Provider: Better Auth generic OAuth plugin
  - Auth: `BETTER_AUTH_GITHUB_CLIENT_ID`, `BETTER_AUTH_GITHUB_CLIENT_SECRET`
  - Redirect URI: `http://localhost:3000/api/auth/callback/github`
  - Config: `src/server/better-auth/config.ts`

- Slack OAuth - Social authentication
  - Provider: Better Auth generic OAuth plugin
  - Auth: `BETTER_AUTH_SLACK_CLIENT_ID`, `BETTER_AUTH_SLACK_CLIENT_SECRET`
  - Discovery URL: `https://slack.com/.well-known/openid-configuration`
  - Scopes: `openid`, `email`, `profile`
  - Config: `src/server/better-auth/config.ts`

## Data Storage

**Databases:**
- PostgreSQL - Primary relational database
  - Connection: `DATABASE_URL` environment variable
  - Client: `postgres` (postgres-js driver)
  - ORM: Drizzle ORM v1 beta
  - Implementation: `src/server/db/index.ts`
  - Schema: `src/server/db/schema.ts`
  - Tables prefix: `ioesu_`
  - Connection pooling: Cached in development via global `postgres.Sql`

**File Storage:**
- S3-compatible storage (AWS S3 or MinIO)
  - SDK: `@aws-sdk/client-s3` (v3.962.0)
  - Auth: `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET_NAME`
  - Endpoint: `S3_ENDPOINT` (optional, defaults to AWS S3)
  - Force path style: `true` (for MinIO compatibility)
  - Implementation: `src/lib/s3.ts`
  - Features: Upload, presigned upload URLs, presigned preview URLs
  - Key pattern: `resources/{uuid}-{filename}`
  - Dev storage: MinIO at `http://localhost:9000` (via start-bucket.sh)
  - Prod storage: AWS S3

**Caching:**
- Database connection caching in development (via global variable)
- No dedicated caching layer (Redis, etc.) detected

## Authentication & Identity

**Auth Provider:**
- Better Auth - Custom authentication solution
  - Implementation: `src/server/better-auth/config.ts`
  - Client: `src/lib/auth-client.ts`
  - Features:
    - Email/password authentication
    - Social OAuth (GitHub, Slack)
    - Magic link authentication
    - Email OTP verification
    - Two-factor authentication
    - Anonymous users
    - API keys with permissions
  - Adapter: Drizzle adapter for PostgreSQL
  - Session management: Custom implementation

**API Key Authentication (MCP):**
- Better Auth API Key plugin
  - Prefix: `ik_` (default)
  - Expiration: 7 days default, 1-365 days configurable
  - Rate limiting: 1000 requests/day per key
  - Permissions: Granular resource-based permissions
  - Implementation: `src/server/better-auth/config.ts`
  - Verification: `src/server/mcp/auth.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, etc.)

**Logs:**
- Console-based logging
- No centralized logging service
- MCP verbose logs enabled in development mode

**Analytics:**
- Vercel Analytics - Usage analytics
  - SDK: `@vercel/analytics` (v1.6.1)
  - Implementation: `src/app/layout.tsx`
  - Component: `<Analytics />`
  - Auto-collects: Page views, web vitals

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from analytics integration and deployment patterns)
  - Environment variable: `VERCEL_URL`
  - Base URL: Auto-constructed from VERCEL_URL

**CI Pipeline:**
- GitHub Actions - Pull request checks
  - Workflow: `.github/workflows/pr-check.yml`
  - Trigger: Pull requests to main branch
  - Runner: `ubuntu-latest`
  - Steps:
    1. Checkout code (`actions/checkout@v6`)
    2. Setup Bun (`oven-sh/setup-bun@v2`)
    3. Install dependencies (`bun install`)
    4. Run linting/formatting check (`bun run check`)
    5. Run typecheck (`bun run typecheck`)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Session encryption key
- `BETTER_AUTH_GITHUB_CLIENT_ID` / `BETTER_AUTH_GITHUB_CLIENT_SECRET` - GitHub OAuth
- `BETTER_AUTH_SLACK_CLIENT_ID` / `BETTER_AUTH_SLACK_CLIENT_SECRET` - Slack OAuth
- `RESEND_API_KEY` - Resend email service API key
- `RESEND_FROM_EMAIL` - Resend from email address
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `S3_REGION` - S3 region (e.g., `us-east-1`)
- `S3_BUCKET_NAME` - S3 bucket name
- `NEXT_PUBLIC_BASE_URL` - Public base URL for client

**Optional env vars:**
- `S3_ENDPOINT` - Custom S3 endpoint (for MinIO or other providers)
- `MCP_URL` - MCP server URL
- `MCP_API_KEY` - MCP API key
- `VERCEL_URL` - Auto-set by Vercel deployment
- `NODE_ENV` - Environment (development, test, production)

**Secrets location:**
- Production: Vercel Environment Variables (inferred)
- Local: `.env` file (gitignored, referenced in `.gitignore`)
- Template: `.env.example` (committed for reference)

## Webhooks & Callbacks

**Incoming:**
- GitHub OAuth callback: `/api/auth/callback/github`
- Slack OAuth callback: Handled via Better Auth's generic OAuth plugin
- MCP server: `/api/mcp` endpoint (via `mcp-handler`)

**Outgoing:**
- Email sending via Resend API
  - No webhook callbacks configured
- No external API webhooks detected (no Stripe, webhooks from external services)

## MCP (Model Context Protocol) Integration

**MCP Server:**
- Implementation: `src/server/mcp/server.ts`
- Handler: `mcp-handler` package (v1.0.7)
- Base path: `/api/mcp`
- Authentication: Bearer token or `x-api-key` header
- Token verification: Better Auth API key validation
- Max duration: 60 seconds
- SSE disabled: Yes (`disableSse: true`)
- Verbose logs: Enabled in development

**MCP Auth:**
- Module: `src/server/mcp/auth.ts`
- Functions:
  - `extractApiKey()` - Extract from Authorization or x-api-key headers
  - `authenticateMCPRequest()` - Verify key with Better Auth
  - `hasPermission()` - Check resource/action permissions
  - `canUseTool()` - Check tool-level permissions
- Permission model: Resource-based with actions (read, write, delete)
- Default permissions configured in Better Auth config

---

*Integration audit: 2026-02-20*
