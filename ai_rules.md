# AI Instructions for ioe-student-utils

This document provides comprehensive guidelines for AI agents (Gemini, Claude, Copilot, Kilo Code, etc.) working on this project.

## 1. Environment & Package Management

- **Runtime:** Bun
- **Package Manager:** Bun
- **Commands:** Always use `bun` (e.g., `bun install`, `bun dev`, `bun run build`).
- **Dependencies:** Check `package.json` before adding new packages. Prefer lightweight, modern alternatives.

## 2. Framework & Architecture

- **Framework:** Next.js 16 (App Router).
- **React:** React 19.
- **Components:** Functional components with TypeScript and [shadcn/ui](./docs/shadcnui.md). Use `lucide-react` for icons.
- **Elysia APIs:**
  - Checkout Elysia LLM docs [here](./docs/elysia.md)
  - Use Elysia for all backend API endpoints in `app/api/[[...slugs]]/route.ts`.
  - ALWAYS use Elysia instance with `.fetch` exports for Next.js App Router integration.
  - Store API routes in `app/api/` with proper HTTP verb exports (GET, POST, PUT, PATCH, DELETE).
  - Return structured responses using Elysia's response patterns: `Response.json({ success: boolean, data?: T, error?: string })`.
  - Use `t` (TypeBox) for runtime validation and type safety: `body: t.Object({ ... })`.
  - Export types for Eden client: `export type App = typeof api` for end-to-end type safety.

## 3. Styling & UI (Tailwind CSS 4)

- **Semantic Colors:** NEVER use rigid hex codes (e.g., `bg-[#fff]`).
- **Standard Classes:** Use `bg-background`, `text-foreground`, `border-border`, `primary`, `secondary`, etc.
- **Dark Mode:** Ensure all components support dark mode via semantic Tailwind classes.
- **Components:** Use Shadcn UI and Radix UI components located in `components/ui/`.
- **Layout:** Use standard Next.js layout patterns (`layout.tsx`, `template.tsx`).

## 4. Authentication (Better Auth)

- **Implementation:** Follow the rules in `docs/better-auth.md`.
- **Client-Side:** Use `authClient` from `@/lib/auth-client`.
- **Server-Side:** Use `auth.api` or `auth.getSession()`.
- **Protected Routes:** Use middleware or server-side session checks in `page.tsx`.

## 5. Coding Standards

- **TypeScript:** Strict mode enabled. Define interfaces for all props and data structures.
- **File Naming:** kebab-case for everything.
- **Folder Structure:**
  - `src/app/`: Routing and server-side logic.
  - `src/app/api/`: Elysia API endpoints (catch-all route pattern).
  - `src/components/`: UI components.
  - `src/lib/`: Shared utilities and configurations (Auth, DB, Eden client, etc.).
  - `src/hooks/`: Custom client-side hooks.
- **Error Handling:** Use try/catch blocks in Elysia API handlers and async functions. Use Elysia's `onError` hook for global error handling. Provide user-friendly error messages with structured responses.
- **Formatting:** After every change, run `bun run check:write` and `bun run typecheck`.
- **Schema Changes:** After each `src/lib/db/schema.ts` changes and run `bun run db:generate` to generate migrations and `bun run db:migrate` to apply them.

## 6. Prohibited Actions

- **DO NOT** read `.env`, `credentials.json`, or `supersecrets.txt`.
- **DO NOT** use `npm`, `yarn`, or `pnpm`.
- **DO NOT** use `inline styles` unless absolutely necessary for dynamic values.
