import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { account, session, user, userProfile } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

/**
 * User API routes for profile management and account operations
 */

export const userRoutes = new Elysia({ prefix: "/user" })
  .use(authorizationPlugin)
  // Get user profile
  .get(
    "/profile",
    async ({ user: currentUser }) => {
      const profile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, currentUser.id),
      });

      return {
        success: true,
        data: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
          bio: profile?.bio ?? null,
          location: profile?.location ?? null,
        },
      };
    },
    {
      auth: true,
      detail: {
        tags: ["User"],
        summary: "Get user profile",
      },
    }
  )
  // Update user profile
  .put(
    "/profile",
    async ({ user: currentUser, body }) => {
      const { name, bio, location } = body;

      // Update user name if provided
      if (name !== undefined) {
        await auth.api.updateUser({
          body: { name },
          headers: new Headers(),
        });
      }

      // Upsert user profile for bio and location
      if (bio !== undefined || location !== undefined) {
        const existingProfile = await db.query.userProfile.findFirst({
          where: eq(userProfile.userId, currentUser.id),
        });

        if (existingProfile) {
          await db
            .update(userProfile)
            .set({
              ...(bio !== undefined && { bio }),
              ...(location !== undefined && { location }),
              updatedAt: new Date(),
            })
            .where(eq(userProfile.userId, currentUser.id));
        } else {
          await db.insert(userProfile).values({
            id: crypto.randomUUID(),
            userId: currentUser.id,
            bio: bio ?? null,
            location: location ?? null,
          });
        }
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
      detail: {
        tags: ["User"],
        summary: "Update user profile",
      },
    }
  )
  // List all users (Admin only)
  .get(
    "/admin/users",
    async () => {
      const users = await db.query.user.findMany({
        with: {
          profile: true,
        },
      });

      return {
        success: true,
        data: users,
      };
    },
    {
      auth: true,
      role: "admin",
      detail: {
        tags: ["Admin"],
        summary: "List all users (Admin Only)",
      },
    }
  )
  // Update any user's profile (Admin or the user themselves)
  .put(
    "/:id/profile",
    async ({ params: { id }, body }) => {
      const { bio, location } = body;

      const existingProfile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, id),
      });

      if (existingProfile) {
        await db
          .update(userProfile)
          .set({
            ...(bio !== undefined && { bio }),
            ...(location !== undefined && { location }),
            updatedAt: new Date(),
          })
          .where(eq(userProfile.userId, id));
      } else {
        await db.insert(userProfile).values({
          id: crypto.randomUUID(),
          userId: id,
          bio: bio ?? null,
          location: location ?? null,
        });
      }

      return {
        success: true,
        message: `Profile for user ${id} updated successfully`,
      };
    },
    {
      auth: true,
      ownerOnly: true,
      body: t.Object({
        bio: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
      detail: {
        tags: ["User"],
        summary: "Update specific user profile (Owner Only)",
      },
    }
  )
  // Delete user account
  .post(
    "/delete-account",
    async ({ user: currentUser, body, set }) => {
      const { password } = body;

      // Verify password by attempting to find the account with password
      const userAccount = await db.query.account.findFirst({
        where: eq(account.userId, currentUser.id),
      });

      if (!userAccount || !userAccount.password) {
        set.status = 400;
        return {
          success: false,
          error: "Unable to verify credentials",
        };
      }

      // Use better-auth's password verification
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

      // Delete user profile first (cascade should handle this, but be explicit)
      await db
        .delete(userProfile)
        .where(eq(userProfile.userId, currentUser.id));

      // Delete user sessions
      await db.delete(session).where(eq(session.userId, currentUser.id));

      // Delete user accounts
      await db.delete(account).where(eq(account.userId, currentUser.id));

      // Delete user
      await db.delete(user).where(eq(user.id, currentUser.id));

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
      detail: {
        tags: ["User"],
        summary: "Delete user account",
      },
    }
  );
