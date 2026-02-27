# Coding Conventions

**Analysis Date:** 2026-02-20

## Naming Patterns

**Files:**
- Use kebab-case for all files: `user-profile.tsx`, `api-keys.ts`, `authorization.ts`
- Test files: `*.test.ts` or `*.spec.ts`
- UI components: kebab-case in `src/components/ui/`

**Functions:**
- camelCase for function names: `createAuthClient`, `useAdminStats`, `handleSubmit`
- Async functions: `async` keyword with descriptive names

**Variables:**
- camelCase: `currentUser`, `testApiKey`, `existingProfile`
- Constants: UPPER_SNAKE_CASE: `GITHUB_REPO_URL`, `DEGREE_LEVELS`

**Types:**
- PascalCase for interfaces: `ResumeData`, `AdminStatsResponse`, `Session`
- Type aliases: PascalCase

**Components:**
- PascalCase for React components: `Button`, `UserProfile`, `StudyPlanner`

## Code Style

**Formatting:**
- Tool: Biome
- Indentation: 2 spaces
- Indent style: spaces
- Line endings: consistent (VCS enabled)

**Linting:**
- Tool: Biome
- Rules: `recommended` enabled
- Organize imports: `on`
- Sorted classes: `warn` for `clsx`, `cva`, `cn` functions
- `noExplicitAny`: off
- A11y rules: disabled in `src/components/**` for specific cases

**Run commands:**
```bash
bun run check          # Check code
bun run check:unsafe   # Check with unsafe fixes
bun run check:write     # Check and auto-fix
bun run typecheck      # TypeScript type checking
```

## Import Organization

**Order:**
1. External library imports
2. Internal imports (using `@/` alias)
3. Relative imports

**Path Aliases:**
- `@/` → `src/` root
- Examples: `@/lib/auth-client`, `@/server/elysia`, `@/components/ui/button`

**Common patterns:**
```typescript
// External
import { describe, expect, it, mock } from "bun:test";
import { Elysia, t } from "elysia";

// Internal
import { apiClient } from "@/lib/eden";
import { auth } from "@/server/better-auth";
import { Button } from "@/components/ui/button";
```

**Auto-organization:**
- Biome automatically organizes imports (`organizeImports: "on"`)
- No manual sorting required

## Error Handling

**API Responses:**
- Structured response pattern: `{ success: boolean, data?: T, error?: string }`
- Set status codes: `set.status = 400`, `set.status = 401`, `set.status = 403`

**Pattern in Elysia routes:**
```typescript
.put("/profile", async ({ user: currentUser, body, set }) => {
  const { name } = body;

  if (!name || name.length < 1) {
    set.status = 400;
    return { success: false, error: "Name is required" };
  }

  try {
    // ... operation
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    set.status = 500;
    return { success: false, error: "Internal server error" };
  }
}, { auth: true, body: t.Object({ ... }) });
```

**Authorization errors:**
- 401: Unauthenticated (no session/API key)
- 403: Unauthorized (wrong role, not owner)
- 404: Resource not found
- 400: Bad request (invalid input)

**Database errors:**
- Use try/catch blocks in async operations
- Use `db.transaction()` for multi-step operations
- Return user-friendly error messages

## Logging

**Framework:** No dedicated logging framework detected

**Patterns:**
- Console logging for debugging (not production logging)
- Error messages returned in API responses
- No structured logging observed

**When to log:**
- Not formally defined in codebase

## Comments

**When to Comment:**
- Complex authorization logic (JSDoc on `authorizationPlugin`)
- Plugin and route documentation
- Multi-step operations (database transactions)

**JSDoc/TSDoc:**
- Used for plugin documentation
- Includes examples: `@example` blocks
- Parameter types and return types

**Pattern:**
```typescript
/**
 * Authorization plugin for Elysia
 *
 * Provides reusable authentication and authorization patterns:
 * - `auth: true` - Requires authentication (session or API key)
 * - `role: "admin"` - Requires specific role
 *
 * @example
 * .get("/profile", handler, { auth: true })
 */
```

## Function Design

**Size:** No strict size limit, but generally:
- Route handlers: 50-150 lines
- Component files: 50-200 lines
- Utility functions: Under 50 lines

**Parameters:**
- Destructured in function signatures: `async ({ user, body, set }) => {}`
- Type-safe with TypeScript interfaces
- Required/optional clearly defined

**Return Values:**
- API handlers: `{ success: boolean, data?: T, error?: string }`
- Component functions: JSX elements or `null`
- Utility functions: Typed return values

**Async patterns:**
- Explicit `async`/`await` usage
- Use `Promise.all()` for parallel operations
- Database operations wrapped in try/catch

## Module Design

**Exports:**
- Named exports: `export const userRoutes`, `export const apiClient`
- Type exports: `export type App`, `export interface ResumeData`
- Default exports: Rare; prefer named exports

**Barrel Files:**
- `src/data/index.ts`: Exports constants and data
- `src/server/elysia/index.ts`: Main Elysia instance export

**Elysia plugin pattern:**
```typescript
export const userRoutes = new Elysia({ prefix: "/user" })
  .use(authorizationPlugin)
  .get("/profile", handler, { auth: true })
  .put("/profile", handler, { auth: true, body: t.Object({ ... }) });
```

**React component pattern:**
```typescript
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("...", { variants: { ... } });

export { Button, buttonVariants };
```

## Database Patterns

**Drizzle ORM conventions:**
- Use `db.query.table.findFirst()` for single records
- Use `db.query.table.findMany()` for lists
- Use `db.insert().values()` for creates
- Use `db.update().set().where()` for updates
- Use `db.delete().where()` for deletes
- Import operators: `import { eq } from "drizzle-orm";`

**Transaction pattern:**
```typescript
await db.transaction(async (trx) => {
  await trx.delete(userProfile).where(eq(userProfile.userId, currentUser.id));
  await trx.delete(session).where(eq(session.userId, currentUser.id));
  // ... more operations
});
```

## Authentication Patterns

**Client-side:**
- Import from `@/lib/auth-client`: `authClient`, `signIn`, `signOut`, `useSession`
- Direct exports for convenience

**Server-side:**
- Import from `@/server/better-auth`: `auth`
- Use `auth.api.getSession({ headers })` for session validation
- Use `auth.api.createApiKey()` for API key generation
- Use `auth.api.verifyApiKey()` for API key validation

**Authorization in routes:**
- `{ auth: true }` - Requires any authentication
- `{ apiKey: true }` - API key only
- `{ sessionAuth: true }` - Session only
- `{ role: "admin" }` - Admin role required
- `{ ownerOnly: true }` - User's own resources
- `{ adminOrOwner: true }` - Admin or owner

## Styling Conventions

**Tailwind CSS 4:**
- Semantic color classes: `bg-background`, `text-foreground`, `border-border`, `primary`, `secondary`
- Dark mode: Automatic via semantic classes
- NO rigid hex codes: Never use `bg-[#fff]` or similar

**Utility functions:**
- `cn()` from `@/lib/utils`: Merges `clsx` and `tailwind-merge`
- `cva()`: Class variance authority for component variants

**Shadcn UI:**
- Components in `src/components/ui/`
- Use Radix UI primitives
- Lucide React icons for iconography

**Component variants:**
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", outline: "...", destructive: "..." },
    size: { default: "...", sm: "...", lg: "..." }
  }
});
```

---

*Convention analysis: 2026-02-20*
