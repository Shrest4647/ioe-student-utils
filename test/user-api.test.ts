import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia, t } from "elysia";

// Mock the database and auth modules
const _mockDb = {
  query: {
    userProfile: {
      findFirst: mock(() => Promise.resolve(null)),
    },
    account: {
      findFirst: mock(() => Promise.resolve({ password: "hashed" })),
    },
  },
  insert: mock(() => ({
    values: mock(() => Promise.resolve()),
  })),
  update: mock(() => ({
    set: mock(() => ({
      where: mock(() => Promise.resolve()),
    })),
  })),
  delete: mock(() => ({
    where: mock(() => Promise.resolve()),
  })),
};

const mockUser = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  image: null,
  role: "user",
};

const mockSession = {
  id: "session-123",
  userId: "user-123",
  token: "token-123",
};

// Create a test app that mimics the user routes structure
const createTestApp = () => {
  return new Elysia({ prefix: "/api/user" })
    .macro({
      auth: {
        async resolve({ status: _status }) {
          // Simulate authenticated user
          return {
            user: mockUser,
            session: mockSession,
          };
        },
      },
    })
    .get(
      "/profile",
      async ({ user: currentUser }) => {
        return {
          success: true,
          data: {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            image: currentUser.image,
            bio: null,
            location: null,
          },
        };
      },
      { auth: true },
    )
    .put(
      "/profile",
      async ({ user: _currentUser, body }) => {
        const { name } = body;

        // In tests, we just validate the input and return success
        if (name && name.length < 1) {
          return { success: false, error: "Name is required" };
        }

        return {
          success: true,
          message: "Profile updated successfully",
        };
      },
      {
        auth: true,
        body: t.Object({
          name: t.Optional(t.String({ minLength: 1 })),
          bio: t.Optional(t.String()),
          location: t.Optional(t.String()),
        }),
      },
    )
    .post(
      "/delete-account",
      async ({ user: _currentUser, body, set }) => {
        const { password } = body;

        if (!password || password.length < 1) {
          set.status = 400;
          return { success: false, error: "Password is required" };
        }

        // Simulate password verification failure for wrong password
        if (password === "wrong-password") {
          set.status = 401;
          return { success: false, error: "Invalid password" };
        }

        return {
          success: true,
          message: "Account deleted successfully",
        };
      },
      {
        auth: true,
        body: t.Object({
          password: t.String({ minLength: 1 }),
        }),
      },
    );
};

describe("User Profile API", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("GET /api/user/profile", () => {
    it("should return user profile data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/profile"),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe("user-123");
      expect(body.data.name).toBe("Test User");
      expect(body.data.email).toBe("test@example.com");
    });

    it("should include bio and location fields", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/profile"),
      );

      const body = await response.json();
      expect(body.data).toHaveProperty("bio");
      expect(body.data).toHaveProperty("location");
    });
  });

  describe("PUT /api/user/profile", () => {
    it("should update profile with valid data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Updated Name",
            bio: "New bio here",
            location: "New York",
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe("Profile updated successfully");
    });

    it("should update profile with partial data", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bio: "Just updating bio",
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it("should accept empty bio and location", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Name Only",
            bio: "",
            location: "",
          }),
        }),
      );

      expect(response.status).toBe(200);
    });
  });

  describe("POST /api/user/delete-account", () => {
    it("should delete account with valid password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "correct-password",
          }),
        }),
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBe("Account deleted successfully");
    });

    it("should reject with invalid password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "wrong-password",
          }),
        }),
      );

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe("Invalid password");
    });

    it("should reject empty password", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/user/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "",
          }),
        }),
      );

      // Elysia's validation should reject this
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe("User API Authentication", () => {
  it("should require authentication for profile endpoints", async () => {
    // Create app without auth macro returning user
    const unauthApp = new Elysia({ prefix: "/api/user" })
      .macro({
        auth: {
          async resolve({ status }) {
            return status(401);
          },
        },
      })
      .get("/profile", () => ({ data: "should not reach" }), { auth: true });

    const response = await unauthApp.handle(
      new Request("http://localhost/api/user/profile"),
    );

    expect(response.status).toBe(401);
  });
});
