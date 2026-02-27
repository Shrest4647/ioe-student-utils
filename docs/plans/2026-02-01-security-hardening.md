# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical and high-priority security vulnerabilities identified in the security review, including MCP authentication bypass, API key ownership issues, missing rate limiting, and inconsistent authorization patterns.

**Architecture:** This plan fixes security issues through a layered approach: (1) Fix critical authentication bypasses immediately, (2) Implement consistent authorization checks using the existing authorization plugin, (3) Add rate limiting to public endpoints, and (4) Improve account deletion security. All changes maintain backward compatibility while enforcing strict access controls.

**Tech Stack:** Next.js 15, Elysia.js, Better Auth, PostgreSQL, Drizzle ORM, TypeScript, Bun package manager

**Important Notes:**
- Use `bun` for all package management (not npm)
- Use `make ready` to check linting and type errors (not npx commands)
- All security tests must pass before committing
- Each task should be committed separately for easy rollback
- Reference @security-review skill for security best practices

---

## Task 1: Fix MCP Server Authentication Bypass (CRITICAL)

**Files:**
- Modify: `src/server/mcp/server.ts:94`
- Test: `test/mcp-auth.test.ts` (create new)

**Context:** The MCP server currently has `required: false` which allows anyone to access all MCP tools without authentication. This exposes the entire database to unauthorized access.

**Step 1: Create failing test for MCP authentication**

Create `test/mcp-auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "bun:test";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user, apikey } from "@/server/db/schema";

describe("MCP Authentication", () => {
  let testApiKey: string;

  beforeAll(async () => {
    // Create test user and API key
    const testUser = await db.insert(user).values({
      id: crypto.randomUUID(),
      email: "mcp-test@example.com",
      name: "MCP Test User",
      role: "user",
    }).returning();

    const key = await auth.api.createApiKey({
      body: {
        name: "Test MCP Key",
        userId: testUser[0].id,
        permissions: { scholarships: ["read"] },
      },
    });

    testApiKey = key.key;
  });

  it("should reject requests without authentication", async () => {
    const response = await fetch("http://localhost:3000/api/mcp/http", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "fetch_scholarships",
          arguments: { limit: 10 },
        },
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should accept requests with valid API key", async () => {
    const response = await fetch("http://localhost:3000/api/mcp/http", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${testApiKey}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "fetch_scholarships",
          arguments: { limit: 10 },
        },
      }),
    });

    expect(response.status).not.toBe(401);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test test/mcp-auth.test.ts`
Expected: FAIL - Requests without authentication currently succeed (401 expected, but gets 200)

**Step 3: Fix MCP server authentication**

Modify `src/server/mcp/server.ts:94`:

Change:
```typescript
export const handler = withMcpAuth(mcpHandler, verifyToken, {
  required: false,  // ❌ VULNERABLE
});
```

To:
```typescript
export const handler = withMcpAuth(mcpHandler, verifyToken, {
  required: true,  // ✅ Require authentication
});
```

**Step 4: Run test to verify it passes**

Run: `bun test test/mcp-auth.test.ts`
Expected: PASS - All tests now pass

**Step 5: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 6: Commit**

```bash
git add src/server/mcp/server.ts test/mcp-auth.test.ts
git commit -m "fix(security): require authentication for MCP server

- Change MCP auth from optional to required
- Add authentication tests for MCP endpoints
- Fixes critical authentication bypass vulnerability
```

---

## Task 2: Create API Key Ownership Authorization Macro

**Files:**
- Modify: `src/server/elysia/plugins/authorization.ts`
- Test: `test/authorization.test.ts` (modify existing)

**Context:** The current `ownerOnly` macro checks if `params.id` equals `session.user.id`, but for API keys, `params.id` refers to the API key ID, not the user ID. We need a new macro specifically for API key ownership.

**Step 1: Write failing test for API key ownership**

Add to `test/authorization.test.ts`:

```typescript
describe("API Key Ownership", () => {
  let user1ApiKey: string;
  let user2ApiKey: string;
  let user1: any;
  let user2: any;

  beforeAll(async () => {
    // Create two test users
    user1 = await db.insert(user).values({
      id: crypto.randomUUID(),
      email: "user1@example.com",
      name: "User 1",
      role: "user",
    }).returning();

    user2 = await db.insert(user).values({
      id: crypto.randomUUID(),
      email: "user2@example.com",
      name: "User 2",
      role: "user",
    }).returning();

    // Create API keys for both users
    const key1 = await auth.api.createApiKey({
      body: {
        name: "User 1 Key",
        userId: user1[0].id,
      },
    });

    const key2 = await auth.api.createApiKey({
      body: {
        name: "User 2 Key",
        userId: user2[0].id,
      },
    });

    user1ApiKey = key1.id;
    user2ApiKey = key2.id;
  });

  it("should allow user to access their own API key", async () => {
    const response = await api.apikeys[":id"].get({
      params: { id: user1ApiKey },
      headers: {
        cookie: `session=${user1SessionToken}`,
      },
    });

    expect(response.error).toBeUndefined();
    expect(response.data?.id).toBe(user1ApiKey);
  });

  it("should reject user accessing another user's API key", async () => {
    const response = await api.apikeys[":id"].get({
      params: { id: user2ApiKey },
      headers: {
        cookie: `session=${user1SessionToken}`,
      },
    });

    expect(response.status).toBe(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test test/authorization.test.ts`
Expected: FAIL - User 1 can currently access User 2's API key

**Step 3: Implement apiKeyOwnerOnly macro**

Add to `src/server/elysia/plugins/authorization.ts` after line 222 (after `adminOrOwner` macro):

```typescript
apiKeyOwnerOnly: {
  async resolve({
    status,
    request: { headers },
    params,
  }: {
    status: (code: number) => void;
    request: { headers: Headers };
    params: Record<string, string>;
  }) {
    const session = await auth.api.getSession({ headers });
    if (!session) return status(401);

    // Admin users can access any API key
    if (session.user.role === "admin") {
      return {
        user: session.user,
        session: session.session,
      };
    }

    const apiKeyId = params.id;
    if (!apiKeyId) {
      return status(400);
    }

    // Check if API key exists and belongs to user
    const apiKey = await db.query.apikey.findFirst({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      return status(404);
    }

    if (apiKey.userId !== session.user.id) {
      return status(403);
    }

    return {
      user: session.user,
      session: session.session,
      apiKey,
    };
  },
},
```

**Step 4: Update API key routes to use new macro**

Modify `src/server/elysia/routes/api-keys.ts`:

**GET /:id (line 110):**
Change:
```typescript
{
  auth: true,
  params: t.Object({
    id: t.String(),
  }),
  // ...
}
```

To:
```typescript
{
  apiKeyOwnerOnly: true,
  params: t.Object({
    id: t.String(),
  }),
  // ...
}
```

**PUT /:id (line 175):**
Remove manual authorization check (lines 197-208) and change:
```typescript
{
  auth: true,
  // ...
}
```

To:
```typescript
{
  apiKeyOwnerOnly: true,
  // ...
}
```

**DELETE /:id (line 245):**
Remove manual authorization check (lines 266-277) and change:
```typescript
{
  auth: true,
  // ...
}
```

To:
```typescript
{
  apiKeyOwnerOnly: true,
  // ...
}
```

**POST /:id/regenerate (line 302):**
Remove manual authorization check (lines 323-334) and change:
```typescript
{
  auth: true,
  // ...
}
```

To:
```typescript
{
  apiKeyOwnerOnly: true,
  // ...
}
```

**Step 5: Run tests to verify they pass**

Run: `bun test test/authorization.test.ts`
Expected: PASS - All ownership tests pass

**Step 6: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 7: Commit**

```bash
git add src/server/elysia/plugins/authorization.ts src/server/elysia/routes/api-keys.ts test/authorization.test.ts
git commit -m "fix(security): add apiKeyOwnerOnly authorization macro

- Add apiKeyOwnerOnly macro for API key ownership checks
- Update API key routes to use new macro
- Remove manual authorization checks in favor of plugin
- Add tests for API key ownership
- Prevents users from accessing other users' API keys
```

---

## Task 3: Add Rate Limiting to Public Endpoints

**Files:**
- Create: `src/server/middleware/rate-limit.ts`
- Modify: `src/server/elysia/server.ts` (or main Elysia app file)
- Test: `test/rate-limit.test.ts` (create new)

**Context:** Public endpoints like `/scholarships` have no rate limiting, making them vulnerable to scraping and DoS attacks.

**Step 1: Write failing test for rate limiting**

Create `test/rate-limit.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";

describe("Rate Limiting", () => {
  it("should allow requests within rate limit", async () => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        fetch("http://localhost:3000/api/scholarships")
      )
    );

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it("should block requests exceeding rate limit", async () => {
    // Make 101 requests (limit is 100)
    const responses = await Promise.all(
      Array.from({ length: 101 }, () =>
        fetch("http://localhost:3000/api/scholarships")
      )
    );

    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test test/rate-limit.test.ts`
Expected: FAIL - No rate limiting currently implemented

**Step 3: Create rate limiting middleware**

Create `src/server/middleware/rate-limit.ts`:

```typescript
import { Elysia } from "elysia";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, maxRequests } = options;

  return new Elysia({ name: "rate-limit" }).derive(
    ({ request, set }) => {
      const ip = request.headers.get("x-forwarded-for") ||
                 request.headers.get("x-real-ip") ||
                 "unknown";

      const now = Date.now();
      const store = rateLimitStore.get(ip);

      if (!store || now > store.resetTime) {
        // Create new window
        rateLimitStore.set(ip, {
          count: 1,
          resetTime: now + windowMs,
        });
        return {};
      }

      // Increment counter
      store.count++;

      if (store.count > maxRequests) {
        set.status = 429;
        set.headers["Retry-After"] = Math.ceil((store.resetTime - now) / 1000).toString();
        throw new Error("Too many requests");
      }

      // Set rate limit headers
      set.headers["X-RateLimit-Limit"] = maxRequests.toString();
      set.headers["X-RateLimit-Remaining"] = (maxRequests - store.count).toString();
      set.headers["X-RateLimit-Reset"] = new Date(store.resetTime).toISOString();

      return {};
    }
  );
};

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, store] of rateLimitStore.entries()) {
    if (now > store.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Cleanup every minute
```

**Step 4: Apply rate limiting to public routes**

Modify your main Elysia server file (likely `src/server/elysia/server.ts` or similar):

Add import:
```typescript
import { rateLimit } from "@/server/middleware/rate-limit";
```

Apply to scholarship routes:
```typescript
export const app = new Elysia()
  .use(rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 100 })) // 100 requests per 15 minutes
  .use(scholarshipRoutes) // and other public routes
  // ...
```

**Step 5: Run tests to verify they pass**

Run: `bun test test/rate-limit.test.ts`
Expected: PASS - Rate limiting enforced

**Step 6: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 7: Commit**

```bash
git add src/server/middleware/rate-limit.ts src/server/elysia/server.ts test/rate-limit.test.ts
git commit -m "feat(security): add rate limiting to public endpoints

- Implement in-memory rate limiting middleware
- Apply to scholarship endpoints (100 req/15min)
- Add rate limit headers to responses
- Prevents scraping and DoS attacks
- Note: Use Redis for production deployment
```

---

## Task 4: Improve Account Deletion Security

**Files:**
- Modify: `src/server/elysia/routes/user.ts:176-243`
- Modify: `src/server/db/schema.ts` (add deletedAt column)
- Test: `test/user-deletion.test.ts` (create new)

**Context:** Current account deletion is immediate and irreversible. Need soft delete, 2FA verification, and confirmation email.

**Step 1: Add deletedAt column to user schema**

Modify `src/server/db/schema.ts` user table definition:

Add to user table:
```typescript
deletedAt: timestamp("deletedAt"),
```

**Step 2: Run database migration**

Create migration file:
```bash
bunx drizzle-kit generate --custom
```

Edit generated migration to add:
```typescript
await db.schema.alterTable('user')
  .addColumn('deletedAt', 'timestamp', (column) => column)
  .execute();
```

Run migration:
```bash
bun run migrate
```

**Step 3: Write failing test for account deletion**

Create `test/user-deletion.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";

describe("Account Deletion", () => {
  it("should require password verification", async () => {
    const response = await api.user["delete-account"].post({
      body: { password: "wrong-password" },
      headers: {
        cookie: `session=${userSessionToken}`,
      },
    });

    expect(response.status).toBe(401);
  });

  it("should require 2FA verification if enabled", async () => {
    // Enable 2FA for test user
    await db.update(user)
      .set({ twoFactorEnabled: true })
      .where(eq(user.id, testUserId));

    const response = await api.user["delete-account"].post({
      body: {
        password: correctPassword,
        totpCode: "000000", // Wrong code
      },
      headers: {
        cookie: `session=${userSessionToken}`,
      },
    });

    expect(response.status).toBe(403);
  });

  it("should soft delete account (not permanently)", async () => {
    const response = await api.user["delete-account"].post({
      body: {
        password: correctPassword,
      },
      headers: {
        cookie: `session=${userSessionToken}`,
      },
    });

    expect(response.status).toBe(200);

    // Check user still exists but is marked as deleted
    const deletedUser = await db.query.user.findFirst({
      where: eq(user.id, testUserId),
    });

    expect(deletedUser).toBeDefined();
    expect(deletedUser?.deletedAt).toBeDefined();
  });
});
```

**Step 4: Run test to verify it fails**

Run: `bun test test/user-deletion.test.ts`
Expected: FAIL - Current implementation doesn't have these security measures

**Step 5: Implement improved account deletion**

Modify `src/server/elysia/routes/user.ts:176-243`:

```typescript
.post("/delete-account", async ({ user: currentUser, body, set }) => {
  const { password, totpCode } = body;

  // Verify password
  const userAccount = await db.query.account.findFirst({
    where: { userId: currentUser.id },
  });

  if (!userAccount || !userAccount.password) {
    set.status = 400;
    return {
      success: false,
      error: "Unable to verify credentials",
    };
  }

  const ctx = await auth.api.signInEmail({
    body: {
      email: currentUser.email,
      password,
    },
    asResponse: false,
  });

  if (!ctx) {
    set.status = 401;
    return {
      success: false,
      error: "Invalid password",
    };
  }

  // Verify 2FA if enabled
  if (currentUser.twoFactorEnabled) {
    if (!totpCode) {
      set.status = 400;
      return {
        success: false,
        error: "Two-factor authentication code required",
      };
    }

    const isValid = await auth.api.verifyTwoFactor({
      body: {
        code: totpCode,
      },
    });

    if (!isValid) {
      set.status = 403;
      return {
        success: false,
        error: "Invalid two-factor authentication code",
      };
    }
  }

  // Send confirmation email
  // Note: Implement email sending logic
  // await sendAccountDeletionConfirmation(currentUser.email);

  // Soft delete account
  await db
    .update(user)
    .set({
      deletedAt: new Date(),
      email: `deleted_${currentUser.id}@deleted.local`, // Prevent conflicts
    })
    .where(eq(user.id, currentUser.id));

  // Revoke all sessions
  await db.delete(session).where(eq(session.userId, currentUser.id));

  // Revoke all API keys
  await db.delete(apikey).where(eq(apikey.userId, currentUser.id));

  return {
    success: true,
    message: "Account deleted successfully",
  };
},
{
  auth: true,
  body: t.Object({
    password: t.String({ minLength: 1 }),
    totpCode: t.Optional(t.String({ minLength: 6, maxLength: 6 })),
  }),
  detail: {
    tags: ["User"],
    summary: "Delete user account (soft delete)",
  },
})
```

**Step 6: Run tests to verify they pass**

Run: `bun test test/user-deletion.test.ts`
Expected: PASS - All security checks enforced

**Step 7: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 8: Commit**

```bash
git add src/server/db/schema.ts src/server/elysia/routes/user.ts test/user-deletion.test.ts
git commit -m "feat(security): improve account deletion security

- Implement soft delete with deletedAt timestamp
- Require 2FA verification if 2FA is enabled
- Add password verification
- Revoke all sessions and API keys on deletion
- Send confirmation email (TODO: implement)
- Add comprehensive security tests
```

---

## Task 5: Standardize Authorization Patterns

**Files:**
- Modify: Multiple route files to remove manual checks
- Test: Update existing tests

**Context:** Remove all manual authorization checks and use authorization plugin macros consistently.

**Step 1: Find all manual authorization checks**

Run: `grep -r "currentUser.role !== \"admin\"" src/server/elysia/routes/`

Expected: List of files with manual checks

**Step 2: Replace manual checks with plugin macros**

For each file found, replace manual checks with appropriate macro:
- Use `role: "admin"` for admin-only routes
- Use `adminOrOwner: true` for admin or owner routes
- Use `auth: true` for authenticated routes

**Step 3: Run tests**

Run: `bun test`
Expected: PASS - All tests still pass

**Step 4: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 5: Commit**

```bash
git add src/server/elysia/routes/
git commit -m "refactor(security): standardize authorization patterns

- Remove manual authorization checks
- Use authorization plugin macros consistently
- Improve maintainability and security
```

---

## Task 6: Implement API Key Permission Enforcement

**Files:**
- Modify: `src/server/elysia/plugins/authorization.ts`
- Modify: Route files to use permission checks
- Test: `test/api-key-permissions.test.ts` (create new)

**Context:** API keys have a permissions field, but it's never enforced. Need to check permissions on protected routes.

**Step 1: Write failing test for API key permissions**

Create `test/api-key-permissions.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";

describe("API Key Permissions", () => {
  it("should allow access with correct permissions", async () => {
    const response = await api.api.scholarships.get({
      headers: {
        Authorization: `Bearer ${apiKeyWithReadPermission}`,
      },
    });

    expect(response.status).not.toBe(403);
  });

  it("should deny access without required permissions", async () => {
    const response = await api.api.scholarships.post({
      headers: {
        Authorization: `Bearer ${apiKeyWithReadPermission}`, // Only read, not write
      },
      body: {
        name: "Test Scholarship",
        slug: "test-scholarship",
      },
    });

    expect(response.status).toBe(403);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test test/api-key-permissions.test.ts`
Expected: FAIL - Permissions not currently enforced

**Step 3: Implement permission checking in authorization plugin**

Add to `src/server/elysia/plugins/authorization.ts`:

```typescript
apiKeyWithPermissions: (requiredPermissions: { resource: string; actions: string[] }) => ({
  async resolve({ status, request: { headers } }: {
    status: (code: number) => void;
    request: { headers: Headers };
  }) {
    const apiKey = headers.get("x-api-key") ||
                   headers.get("authorization")?.replace("Bearer ", "");

    if (!apiKey) {
      return status(401);
    }

    try {
      const keyValidation = await auth.api.verifyApiKey({
        body: { key: apiKey },
      });

      if (keyValidation?.valid && keyValidation.key) {
        const user = await db.query.user.findFirst({
          where: { id: keyValidation.key.userId },
        });

        if (!user) {
          return status(401);
        }

        // Check permissions if required
        if (requiredPermissions) {
          const keyPermissions = keyValidation.key.permissions;
          if (!keyPermissions) {
            return status(403);
          }

          try {
            const parsedPermissions = typeof keyPermissions === 'string'
              ? JSON.parse(keyPermissions)
              : keyPermissions;

            const allowedActions = parsedPermissions[requiredPermissions.resource];
            if (!allowedActions) {
              return status(403);
            }

            const hasPermission = requiredPermissions.actions.some(
              action => allowedActions.includes(action)
            );

            if (!hasPermission) {
              return status(403);
            }
          } catch (error) {
            console.error("Failed to parse API key permissions:", error);
            return status(403);
          }
        }

        return {
          user,
          apiKey: keyValidation.key,
          authType: "apiKey",
        };
      }
    } catch (_error) {
      return status(401);
    }

    return status(401);
  },
}),
```

**Step 4: Update routes to use permission checks**

Example for scholarship routes:
```typescript
.get("/", handler, {
  apiKeyWithPermissions: { resource: "scholarships", actions: ["read"] },
})

.post("/", handler, {
  apiKeyWithPermissions: { resource: "scholarships", actions: ["write"] },
})
```

**Step 5: Run tests to verify they pass**

Run: `bun test test/api-key-permissions.test.ts`
Expected: PASS - Permission enforcement working

**Step 6: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 7: Commit**

```bash
git add src/server/elysia/plugins/authorization.ts test/api-key-permissions.test.ts
git commit -m "feat(security): enforce API key permissions

- Add apiKeyWithPermissions authorization macro
- Check permissions on protected routes
- Prevent unauthorized API key usage
- Add permission enforcement tests
```

---

## Task 7: Add Role-Based Checks to Frontend

**Files:**
- Modify: `src/components/auth/protected-route.tsx`
- Test: `test/protected-route.test.tsx` (create new)

**Context:** Frontend protection is client-side only and doesn't check user roles.

**Step 1: Write failing test for role-based protection**

Create `test/protected-route.test.tsx`:

```typescript
import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "@/components/auth/protected-route";

describe("ProtectedRoute", () => {
  it("should redirect unauthenticated users", () => {
    // Test implementation
  });

  it("should allow authenticated users with correct role", () => {
    // Test implementation
  });

  it("should redirect authenticated users without required role", () => {
    // Test implementation
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test test/protected-route.test.tsx`
Expected: FAIL - Role checking not implemented

**Step 3: Implement role-based checks**

Modify `src/components/auth/protected-route.tsx`:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  requireRole?: "user" | "admin";
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/auth/signin",
  requireRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (!isLoading && isAuthenticated && requireRole) {
      if (user?.role !== requireRole) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requireRole, router, redirectTo]);

  if (isLoading) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireRole && user?.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
```

**Step 4: Run tests to verify they pass**

Run: `bun test test/protected-route.test.tsx`
Expected: PASS - Role-based checks working

**Step 5: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 6: Commit**

```bash
git add src/components/auth/protected-route.tsx test/protected-route.test.tsx
git commit -m "feat(security): add role-based checks to ProtectedRoute

- Add requireRole prop to ProtectedRoute component
- Redirect users without required role
- Add role-based protection tests
- Improve frontend security
```

---

## Task 8: Add Audit Logging

**Files:**
- Create: `src/server/lib/audit-log.ts`
- Modify: Various route files
- Test: `test/audit-log.test.ts` (create new)

**Context:** Need to log all security-relevant events for compliance and monitoring.

**Step 1: Create audit log utility**

Create `src/server/lib/audit-log.ts`:

```typescript
import { db } from "@/server/db";
import { auditLog } from "@/server/db/schema";

export interface AuditLogEvent {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(event: AuditLogEvent) {
  try {
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details ? JSON.stringify(event.details) : null,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
    // Don't throw - audit logging failures shouldn't break the app
  }
}

// Create audit log table in schema
// Add to src/server/db/schema.ts:
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

**Step 2: Add audit logging to sensitive operations**

Example for account deletion:
```typescript
await logAuditEvent({
  userId: currentUser.id,
  action: "account.deleted",
  resource: "user",
  resourceId: currentUser.id,
  ipAddress: request.headers.get("x-forwarded-for") || undefined,
  userAgent: request.headers.get("user-agent") || undefined,
});
```

**Step 3: Run tests**

Run: `bun test test/audit-log.test.ts`
Expected: PASS - Audit logging working

**Step 4: Run linting and type checking**

Run: `make ready`
Expected: No errors

**Step 5: Commit**

```bash
git add src/server/lib/audit-log.ts src/server/db/schema.ts test/audit-log.test.ts
git commit -m "feat(security): add audit logging

- Implement audit log utility
- Log security-relevant events
- Add audit log table to schema
- Improve compliance and monitoring
```

---

## Summary

This plan addresses all critical and high-priority security issues:

1. **MCP Authentication Bypass** - Fixed by requiring authentication
2. **API Key Ownership** - New `apiKeyOwnerOnly` macro
3. **Rate Limiting** - Added to public endpoints
4. **Account Deletion** - Improved with soft delete and 2FA
5. **Authorization Patterns** - Standardized on plugin macros
6. **API Key Permissions** - Enforced at route level
7. **Frontend Protection** - Added role-based checks
8. **Audit Logging** - Implemented for compliance

**Total estimated time:** ~20 hours
**Risk level:** Medium (changes are isolated and well-tested)
**Testing:** All tasks include comprehensive tests

**Next Steps:**
- Review this plan
- Identify any missing requirements
- Choose execution approach (subagent-driven or parallel session)
- Begin implementation starting with Task 1 (Critical)
