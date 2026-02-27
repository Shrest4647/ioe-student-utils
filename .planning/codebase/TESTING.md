# Testing Patterns

**Analysis Date:** 2026-02-20

## Test Framework

**Runner:**
- Bun Test (built into Bun)
- Import from `"bun/test"`

**Assertion Library:**
- Bun Test's built-in `expect`

**Run Commands:**
```bash
bun test              # Run all tests
# (No specific watch mode command observed)
# (No coverage command observed)
```

**Available test functions:**
- `describe` - Group tests
- `it` - Individual test case
- `expect` - Assertions
- `mock` - Create mocks
- `beforeAll` - Setup before all tests
- `beforeEach` - Setup before each test

## Test File Organization

**Location:**
- Tests co-located in `test/` directory (not alongside source files)
- Integration tests in `test/integration/mcp/`

**Naming:**
- `*.test.ts` - Standard test files
- `*.spec.ts` - Specification-style tests

**Structure:**
```
test/
├── integration/
│   └── mcp/
│       └── server.test.ts
├── specs/
│   └── study-plans.spec.ts
├── authorization.test.ts
├── course-explorer-api.test.ts
├── mcp-auth.test.ts
├── user-api.test.ts
└── verify-multiple-attachments.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, expect, it, mock, beforeEach, beforeAll } from "bun:test";

describe("Feature Name", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("Specific Scenario", () => {
    it("should do something expected", async () => {
      // Arrange
      const request = new Request("http://localhost/api/test");

      // Act
      const response = await app.handle(request);

      // Assert
      expect(response.status).toBe(200);
    });
  });
});
```

**Setup Patterns:**
- `beforeAll()`: Create test data, setup database records
- `beforeEach()`: Reset app instance, clear state
- Mock functions created with `mock(() => ...)`

**Teardown Pattern:**
- No explicit teardown observed
- Tests run independently

**Assertion Pattern:**
```typescript
expect(response.status).toBe(200);
expect(body.success).toBe(true);
expect(body.data).toBeDefined();
expect([401, 403]).toContain(response.status); // Multiple valid values
```

## Mocking

**Framework:** Bun Test's built-in `mock()`

**Patterns:**

**Simple function mock:**
```typescript
const mockDb = {
  query: {
    userProfile: {
      findFirst: mock(() => Promise.resolve(null)),
    },
  },
};
```

**Behavior-based mock with args:**
```typescript
const mockDbQuery = {
  findFirst: mock((args: any) => {
    if (args.where.id === "apikey-1") {
      return Promise.resolve(mockUser1ApiKey);
    }
    return Promise.resolve(null);
  }),
};
```

**Elysia plugin mock:**
```typescript
const createAuthPlugin = (authenticatedUser: User | null) => {
  return new Elysia({ name: "test-auth" }).macro({
    auth: {
      async resolve({ status }) {
        if (!authenticatedUser) return status(401);
        return { user: authenticatedUser, session: mockSession };
      },
    },
  });
};
```

**What to Mock:**
- Database queries: `db.query.*.findFirst()`, `db.insert()`, `db.update()`
- External API calls
- Authentication sessions
- Authorization plugins

**What NOT to Mock:**
- Elysia request handling (use `.handle()`)
- Response validation (assert on status/body)
- Route logic (test real handlers with mocked dependencies)

## Fixtures and Factories

**Test Data:**
```typescript
// Mock data defined at file level
const mockAdminUser = {
  id: "admin-123",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

const mockSession = {
  id: "session-123",
  userId: "user-456",
  token: "token-123",
};
```

**Dynamic data generation:**
```typescript
beforeAll(async () => {
  const uniqueId = crypto.randomUUID();
  const testUser = await db.insert(user).values({
    id: uniqueId,
    email: `mcp-test-${uniqueId}@example.com`,
    name: "MCP Test User",
    role: "user",
  }).returning();
});
```

**Location:**
- Test fixtures inline in test files
- No shared fixture directory observed

## Coverage

**Requirements:** None enforced

**View Coverage:**
- No coverage command found in `package.json`

**Coverage Gaps:**
- No formal coverage tracking
- Test files exist for:
  - Authorization (`authorization.test.ts`)
  - User API (`user-api.test.ts`)
  - Course Explorer (`course-explorer-api.test.ts`)
  - MCP Auth (`mcp-auth.test.ts`)
  - Attachments (`verify-multiple-attachments.test.ts`)
  - Study Plans (`study-plans.spec.ts`)

## Test Types

**Unit Tests:**
- Testing individual functions and components
- Example: `verify-multiple-attachments.test.ts`

**Integration Tests:**
- Testing API endpoints with real Elysia instances
- Testing authorization flows
- Example: `authorization.test.ts`, `user-api.test.ts`, `course-explorer-api.test.ts`

**E2E Tests:**
- Not detected

## Common Patterns

**Async Testing:**
```typescript
it("should handle async operations", async () => {
  const response = await app.handle(
    new Request("http://localhost/api/test", { method: "POST" })
  );

  const body = await response.json();
  expect(body.success).toBe(true);
});
```

**Error Testing:**
```typescript
it("should reject with invalid password", async () => {
  const response = await app.handle(
    new Request("http://localhost/api/user/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    })
  );

  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.error).toBe("Invalid password");
});
```

**Authentication Testing:**
```typescript
it("should require authentication", async () => {
  const response = await app.handle(
    new Request("http://localhost/api/protected")
  );

  expect(response.status).toBe(401);
});
```

**Authorization Testing:**
```typescript
describe("role macro", () => {
  it("should allow admin access to admin-only routes", async () => {
    const app = new Elysia()
      .use(createAuthPlugin(mockAdminUser))
      .get("/admin/dashboard", ({ user }) => ({ admin: user.name }), {
        role: "admin",
      });

    const response = await app.handle(
      new Request("http://localhost/admin/dashboard")
    );

    expect(response.status).toBe(200);
  });

  it("should reject non-admin users from admin routes with 403", async () => {
    const app = new Elysia()
      .use(createAuthPlugin(mockRegularUser))
      .get("/admin/dashboard", () => ({ message: "should not reach" }), {
        role: "admin",
      });

    const response = await app.handle(
      new Request("http://localhost/admin/dashboard")
    );

    expect(response.status).toBe(403);
  });
});
```

**Conditional Testing:**
```typescript
it("returns unit by slug", async () => {
  const courseResponse = await elysiaApi
    .handle(new Request("http://localhost/api/course-explorer/courses/slug/bct-301"))
    .then((res) => res.json());

  const units = courseResponse.data?.units || [];
  if (units.length > 0) {
    const unitSlug = units[0].slug;
    const response = await elysiaApi
      .handle(new Request(`http://localhost/api/course-explorer/units/slug/${unitSlug}`))
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data.slug).toBe(unitSlug);
  }
});
```

## API Testing Patterns

**Elysia instance testing:**
```typescript
// Use real Elysia instance
import { elysiaApi } from "@/server/elysia";

describe("Course Explorer API", () => {
  it("returns course list", async () => {
    const response = await elysiaApi
      .handle(new Request("http://localhost/api/course-explorer/courses"))
      .then((res) => res.json());

    expect(response).toBeDefined();
    expect(response.data).toBeInstanceOf(Array);
  });
});
```

**Mock Elysia instance:**
```typescript
// Create test app with mocked auth
const createTestApp = () => {
  return new Elysia({ prefix: "/api/user" })
    .macro({
      auth: {
        async resolve({ status: _status }) {
          return { user: mockUser, session: mockSession };
        },
      },
    })
    .get("/profile", async ({ user: currentUser }) => {
      return { success: true, data: { id: currentUser.id, name: currentUser.name } };
    }, { auth: true });
};
```

**Request building:**
```typescript
// GET request
const response = await app.handle(
  new Request("http://localhost/api/test")
);

// POST with JSON body
const response = await app.handle(
  new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test" }),
  });
);

// PUT request
const response = await app.handle(
  new Request("http://localhost/api/test", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bio: "New bio" }),
  });
);
```

## Database Testing Patterns

**Test database setup:**
```typescript
import { db } from "@/server/db";
import { user } from "@/server/db/schema";

beforeAll(async () => {
  const uniqueId = crypto.randomUUID();
  const testUser = await db
    .insert(user)
    .values({
      id: uniqueId,
      email: `test-${uniqueId}@example.com`,
      name: "Test User",
      role: "user",
    })
    .returning();
});
```

**No cleanup pattern observed:**
- Tests may leave records in database
- Unique IDs via `crypto.randomUUID()` prevent conflicts

---

*Testing analysis: 2026-02-20*
