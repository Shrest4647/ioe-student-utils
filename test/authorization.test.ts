import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

// Mock session and user data
const mockAdminUser = {
  id: "admin-123",
  name: "Admin User",
  email: "admin@example.com",
  role: "admin",
};

const mockRegularUser = {
  id: "user-456",
  name: "Regular User",
  email: "user@example.com",
  role: "user",
};

const mockSession = {
  id: "session-123",
  userId: "user-456",
  token: "token-123",
};

/**
 * Create a test authorization plugin that mimics the real authorization plugin
 * but with controllable authentication state
 */
const createAuthPlugin = (
  authenticatedUser: typeof mockAdminUser | typeof mockRegularUser | null,
) => {
  return new Elysia({ name: "test-auth" }).macro({
    auth: {
      async resolve({ status }) {
        if (!authenticatedUser) return status(401);
        return {
          user: authenticatedUser,
          session: mockSession,
        };
      },
    },
    role: (requiredRole: "user" | "admin") => ({
      async resolve({ status }: { status: (code: number) => void }) {
        if (!authenticatedUser) return status(401);
        if (authenticatedUser.role !== requiredRole) {
          return status(403);
        }
        return {
          user: authenticatedUser,
          session: mockSession,
        };
      },
    }),
    ownerOnly: {
      async resolve({
        status,
        params,
      }: {
        status: (code: number) => void;
        params: Record<string, string>;
      }) {
        if (!authenticatedUser) return status(401);

        const resourceId = params.id || params.userId;
        if (resourceId && resourceId !== authenticatedUser.id) {
          return status(403);
        }

        return {
          user: authenticatedUser,
          session: mockSession,
        };
      },
    },
  });
};

describe("Authorization Plugin", () => {
  describe("auth macro", () => {
    it("should allow authenticated requests", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(mockRegularUser))
        .get("/protected", ({ user }) => ({ userId: user.id }), { auth: true });

      const response = await app.handle(
        new Request("http://localhost/protected"),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.userId).toBe("user-456");
    });

    it("should reject unauthenticated requests with 401", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(null))
        .get("/protected", () => ({ message: "should not reach" }), {
          auth: true,
        });

      const response = await app.handle(
        new Request("http://localhost/protected"),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("role macro", () => {
    it("should allow admin access to admin-only routes", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(mockAdminUser))
        .get("/admin/dashboard", ({ user }) => ({ admin: user.name }), {
          role: "admin",
        });

      const response = await app.handle(
        new Request("http://localhost/admin/dashboard"),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.admin).toBe("Admin User");
    });

    it("should reject non-admin users from admin routes with 403", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(mockRegularUser))
        .get("/admin/dashboard", () => ({ message: "should not reach" }), {
          role: "admin",
        });

      const response = await app.handle(
        new Request("http://localhost/admin/dashboard"),
      );

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated users from role-protected routes", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(null))
        .get("/admin/dashboard", () => ({ message: "should not reach" }), {
          role: "admin",
        });

      const response = await app.handle(
        new Request("http://localhost/admin/dashboard"),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("ownerOnly macro", () => {
    it("should allow users to access their own resources", async () => {
      const app = new Elysia().use(createAuthPlugin(mockRegularUser)).get(
        "/user/:id/settings",
        ({ user, params }) => ({
          userId: user.id,
          requestedId: params.id,
        }),
        { ownerOnly: true },
      );

      const response = await app.handle(
        new Request("http://localhost/user/user-456/settings"),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.userId).toBe("user-456");
      expect(body.requestedId).toBe("user-456");
    });

    it("should reject access to other users resources with 403", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(mockRegularUser))
        .get("/user/:id/settings", () => ({ message: "should not reach" }), {
          ownerOnly: true,
        });

      const response = await app.handle(
        new Request("http://localhost/user/other-user-789/settings"),
      );

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated requests", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(null))
        .get("/user/:id/settings", () => ({ message: "should not reach" }), {
          ownerOnly: true,
        });

      const response = await app.handle(
        new Request("http://localhost/user/user-456/settings"),
      );

      expect(response.status).toBe(401);
    });

    it("should work with userId param as well as id", async () => {
      const app = new Elysia()
        .use(createAuthPlugin(mockRegularUser))
        .get("/profile/:userId", ({ user }) => ({ name: user.name }), {
          ownerOnly: true,
        });

      const response = await app.handle(
        new Request("http://localhost/profile/user-456"),
      );

      expect(response.status).toBe(200);
    });
  });
});

describe("Authorization Integration", () => {
  it("should support combining auth and role macros", async () => {
    const app = new Elysia()
      .use(createAuthPlugin(mockAdminUser))
      .get("/admin/users", ({ user }) => ({ adminName: user.name }), {
        auth: true,
        role: "admin",
      });

    const response = await app.handle(
      new Request("http://localhost/admin/users"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.adminName).toBe("Admin User");
  });

  it("should properly chain authorization checks", async () => {
    // Test that all auth checks are applied
    const appWithAdmin = new Elysia()
      .use(createAuthPlugin(mockAdminUser))
      .put("/user/:id/role", ({ user }) => ({ updatedBy: user.id }), {
        auth: true,
        role: "admin",
      });

    // Admin should succeed
    const adminResponse = await appWithAdmin.handle(
      new Request("http://localhost/user/user-456/role", {
        method: "PUT",
      }),
    );
    expect(adminResponse.status).toBe(200);

    // Regular user should fail with 403
    const appWithUser = new Elysia()
      .use(createAuthPlugin(mockRegularUser))
      .put("/user/:id/role", () => ({ message: "should not reach" }), {
        role: "admin",
      });

    const userResponse = await appWithUser.handle(
      new Request("http://localhost/user/user-456/role", {
        method: "PUT",
      }),
    );
    expect(userResponse.status).toBe(403);
  });
});
