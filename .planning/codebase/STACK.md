# Technology Stack

**Analysis Date:** 2026-02-20

## Languages

**Primary:**
- TypeScript 5 - All source files (`.ts`, `.tsx`)
  - Config: `tsconfig.json`
  - Target: ES2017
  - Strict mode: enabled

**Secondary:**
- CSS - Tailwind CSS v4 with custom theme
  - File: `src/styles/globals.css`
- JSX/TSX - React 19 components
- SQL - Drizzle migrations (`drizzle/` directory)

## Runtime

**Environment:**
- Bun - JavaScript runtime and package manager
  - Lockfile: `bun.lockb` (binary)
  - Runtime version: Latest (via `@types/bun`)

**Package Manager:**
- Bun - For all package operations
  - Scripts use `bun` prefix: `bun install`, `bun dev`, `bun build`
  - No npm/yarn/pnpm usage (prohibited per AGENTS.md)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework (App Router)
  - File: `src/app/` - Page routing and layouts
  - Configuration: `next.config.ts`
  - Turbo mode: Enabled (`--turbo` flag in dev script)
- React 19.2.4 - UI library
- Elysia 1.4.19 - Backend API framework
  - Location: `src/server/elysia/`
  - Integration: Exported via `.fetch` to Next.js App Router
  - File: `src/app/api/[[...slugs]]/route.ts`

**UI Components:**
- Shadcn UI - Component library built on Radix UI
  - Configuration: `components.json`
  - Path: `src/components/ui/`
  - Style: Radix Mira
- Radix UI 1.4.3 - Headless UI primitives
- Lucide React 0.562.0 - Icon library
- Framer Motion 12.23.26 - Animation library

**Database:**
- Drizzle ORM 1.0.0-beta.8-734e789 - Type-safe ORM
  - Configuration: `drizzle.config.ts`
  - Schema: `src/server/db/schema.ts`
  - Relations: `src/server/db/relations.ts`
- postgres 3.4.4 - PostgreSQL driver

**Authentication:**
- Better Auth 1.4.10 - Authentication solution
  - Configuration: `src/server/better-auth/config.ts`
  - Plugins: GitHub OAuth, Slack OAuth, API keys, magic link, 2FA, email OTP
  - Adapter: Drizzle (`@auth/drizzle-adapter`)

**API & Type Safety:**
- Elysia Eden Treaty 1.4.6 - Type-safe API client
  - Client: `src/lib/eden.ts`
  - Server types: `src/server/elysia/eden.ts`
- TypeBox - Runtime validation (via Elysia `t`)

**MCP (Model Context Protocol):**
- @modelcontextprotocol/sdk 1.25.3 - MCP SDK
- mcp-handler 1.0.7 - MCP server handler
- Implementation: `src/server/mcp/server.ts`

**Email:**
- React Email 1.0.3 - Email component library
  - Templates: `src/server/emails/*.tsx`
- Resend 6.6.0 - Email delivery service

**Testing:**
- Bun Test - Built-in test framework
  - Test files: `test/` directory
  - No separate test runner configured

**Build/Dev:**
- Biome 2.2.5 - Linter and formatter (replaces ESLint/Prettier)
  - Config: `biome.jsonc`
  - Scripts: `bun run check`, `bun run check:write`
- PostCSS 8.5.3 - CSS processing
  - Config: `postcss.config.mjs`

## Key Dependencies

**Critical:**
- @t3-oss/env-nextjs 0.12.0 - Environment variable validation with Zod
  - Schema: `src/env.js`
- Zod 4.3.6 - Runtime type validation

**Infrastructure:**
- @aws-sdk/client-s3 3.962.0 - S3 client for file storage
  - Implementation: `src/lib/s3.ts`
- @aws-sdk/s3-request-presigner 3.962.0 - S3 presigned URLs
- drizzle-kit 1.0.0-beta.8-734e789 - Database CLI tool

**Frontend Utilities:**
- @tanstack/react-query 5.90.16 - Server state management
- @tanstack/react-form 1.27.7 - Form handling
- @xyflow/react 12.10.0 - Flow/diagram components
- Recharts 2.15.4 - Charting library
- React Markdown 10.1.0 - Markdown rendering with GFM support
- date-fns 4.1.0 - Date manipulation

**Specialized:**
- @better-upload/client 3.0.12 & @better-upload/server 3.0.12 - File upload handling
- @zxcvbn-ts/* 3.0.4 - Password strength validation
- @react-pdf/renderer 4.3.2 - PDF generation

## Configuration

**Environment:**
- Validation via `@t3-oss/env-nextjs` with Zod schemas
  - File: `src/env.js`
  - Variables defined: `appEnv` object with `server` and `client` schemas
  - Runtime env: `src/.env` (gitignored), `.env.example` for reference

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth session encryption
- `BETTER_AUTH_GITHUB_CLIENT_ID` & `_SECRET` - GitHub OAuth
- `BETTER_AUTH_SLACK_CLIENT_ID` & `_SECRET` - Slack OAuth
- `RESEND_API_KEY` & `RESEND_FROM_EMAIL` - Email service
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET_NAME` - S3 storage
- `S3_ENDPOINT` - Optional S3 endpoint (for MinIO)
- `NEXT_PUBLIC_BASE_URL` - Public base URL

**Build:**
- TypeScript config: `tsconfig.json`
  - Path alias: `@/*` maps to `./src/*`
  - JSX: `react-jsx` (new JSX transform)
- Next.js config: `next.config.ts`
  - Remote image patterns: All HTTPS/HTTP allowed
- PostCSS config: `postcss.config.mjs`
  - Plugin: `@tailwindcss/postcss`

**Code Quality:**
- Biome config: `biome.jsonc`
  - Linter: Recommended rules enabled
  - Formatter: 2-space indentation, space indent style
  - Auto-import organization: Enabled

**Database:**
- Drizzle config: `drizzle.config.ts`
  - Dialect: PostgreSQL
  - Schema: `src/server/db/schema.ts`
  - Tables filter: `ioesu_*` prefix

## Platform Requirements

**Development:**
- Bun runtime (latest)
- PostgreSQL database (local or remote)
- S3-compatible storage (MinIO for local dev, AWS S3 for prod)
- Node.js types: `@types/node: ^20`

**Production:**
- Vercel (inferred from Vercel Analytics and CI/CD)
- PostgreSQL database
- AWS S3 or S3-compatible storage
- Resend API key for emails
- GitHub/Slack OAuth apps configured

**CI/CD:**
- GitHub Actions for PR checks
  - Workflow: `.github/workflows/pr-check.yml`
  - Steps: Checkout, setup Bun, install deps, lint/typecheck
  - Runs on: ubuntu-latest

---

*Stack analysis: 2026-02-20*
