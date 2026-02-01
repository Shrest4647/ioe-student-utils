import { describe, expect, it, mock } from "bun:test";
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

describe("API Key Ownership", () => {
  // Mock API keys belonging to different users
  const mockUser1ApiKey = {
    id: "apikey-1",
    name: "User 1 Key",
    userId: "user-456", // Belongs to mockRegularUser
    prefix: "pk1",
    enabled: true,
  };

  const mockUser2ApiKey = {
    id: "apikey-2",
    name: "User 2 Key",
    userId: "other-user-789", // Belongs to a different user
    prefix: "pk2",
    enabled: true,
  };

  const mockDbQuery = {
    findFirst: mock((args: any) => {
      // Mock database query to return API key by ID
      if (args.where.id === "apikey-1") {
        return Promise.resolve(mockUser1ApiKey);
      }
      if (args.where.id === "apikey-2") {
        return Promise.resolve(mockUser2ApiKey);
      }
      return Promise.resolve(null);
    }),
  };

  // Create test auth plugin with apiKeyOwnerOnly macro
  const createApiKeyAuthPlugin = (
    authenticatedUser: typeof mockAdminUser | typeof mockRegularUser | null,
    mockDb: any,
  ) => {
    return new Elysia({ name: "test-apikey-auth" }).macro({
      apiKeyOwnerOnly: {
        async resolve({
          status,
          params,
        }: {
          status: (code: number) => void;
          params: Record<string, string>;
        }) {
          if (!authenticatedUser) return status(401);

          const apiKeyId = params.id;
          if (!apiKeyId) {
            return status(400);
          }

          // Check if API key exists
          const apiKey = await mockDb.findFirst({ where: { id: apiKeyId } });

          if (!apiKey) {
            return status(404);
          }

          // Admin users can access any API key
          if (authenticatedUser.role === "admin") {
            return {
              user: authenticatedUser,
              session: mockSession,
              apiKey,
            };
          }

          // Regular users can only access their own API keys
          if (apiKey.userId !== authenticatedUser.id) {
            return status(403);
          }

          return {
            user: authenticatedUser,
            session: mockSession,
            apiKey,
          };
        },
      },
    });
  };

  it("should allow user to access their own API key", async () => {
    const app = new Elysia()
      .use(createApiKeyAuthPlugin(mockRegularUser, mockDbQuery))
      .get(
        "/apikeys/:id",
        ({ apiKey }) => ({
          id: apiKey.id,
          name: apiKey.name,
        }),
        { apiKeyOwnerOnly: true },
      );

    const response = await app.handle(
      new Request("http://localhost/apikeys/apikey-1"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("apikey-1");
    expect(body.name).toBe("User 1 Key");
  });

  it("should reject user accessing another user's API key", async () => {
    const app = new Elysia()
      .use(createApiKeyAuthPlugin(mockRegularUser, mockDbQuery))
      .get("/apikeys/:id", () => ({ message: "should not reach" }), {
        apiKeyOwnerOnly: true,
      });

    const response = await app.handle(
      new Request("http://localhost/apikeys/apikey-2"),
    );

    expect(response.status).toBe(403);
  });

  it("should allow admin to access any API key", async () => {
    const app = new Elysia()
      .use(createApiKeyAuthPlugin(mockAdminUser, mockDbQuery))
      .get(
        "/apikeys/:id",
        ({ apiKey }) => ({
          id: apiKey.id,
          name: apiKey.name,
        }),
        { apiKeyOwnerOnly: true },
      );

    const response = await app.handle(
      new Request("http://localhost/apikeys/apikey-2"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("apikey-2");
  });

  it("should return 404 for non-existent API key", async () => {
    const app = new Elysia()
      .use(createApiKeyAuthPlugin(mockRegularUser, mockDbQuery))
      .get("/apikeys/:id", () => ({ message: "should not reach" }), {
        apiKeyOwnerOnly: true,
      });

    const response = await app.handle(
      new Request("http://localhost/apikeys/nonexistent"),
    );

    expect(response.status).toBe(404);
  });

  it("should reject unauthenticated requests", async () => {
    const app = new Elysia()
      .use(createApiKeyAuthPlugin(null, mockDbQuery))
      .get("/apikeys/:id", () => ({ message: "should not reach" }), {
        apiKeyOwnerOnly: true,
      });

    const response = await app.handle(
      new Request("http://localhost/apikeys/apikey-1"),
    );

    expect(response.status).toBe(401);
  });
});
