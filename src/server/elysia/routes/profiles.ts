import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { resumeProfiles } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const profileRoutes = new Elysia({ prefix: "/profiles" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ user }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        return {
          success: true,
          data: null,
        };
      }

      return {
        success: true,
        data: profile,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get user's resume profile",
      },
    },
  )
  .post(
    "/",
    async ({ user, body }) => {
      const id = crypto.randomUUID();

      await db.insert(resumeProfiles).values({
        id,
        userId: user.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        nationality: body.nationality ?? null,
        dateOfBirth: body.dateOfBirth ?? null,
        photoUrl: body.photoUrl ?? null,
        summary: body.summary ?? null,
        linkedIn: body.linkedIn ?? null,
        github: body.github ?? null,
        web: body.web ?? null,
      });

      const profile = await db.query.resumeProfiles.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: profile,
      };
    },
    {
      auth: true,
      body: t.Object({
        firstName: t.String({ minLength: 1 }),
        lastName: t.String({ minLength: 1 }),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(
          t.Object({
            street: t.Optional(t.String()),
            city: t.Optional(t.String()),
            state: t.Optional(t.String()),
            postalCode: t.Optional(t.String()),
            country: t.Optional(t.String()),
          }),
        ),
        nationality: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()), // Year-month format
        photoUrl: t.Optional(t.String()),
        summary: t.Optional(t.String()),
        linkedIn: t.Optional(t.String()),
        github: t.Optional(t.String()),
        web: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Create a new resume profile",
      },
    },
  )
  .patch(
    "/",
    async ({ user, body, set }) => {
      const existing = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      await db
        .update(resumeProfiles)
        .set({
          ...(body.firstName && { firstName: body.firstName }),
          ...(body.lastName && { lastName: body.lastName }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.address !== undefined && { address: body.address }),
          ...(body.nationality !== undefined && { nationality: body.nationality }),
          ...(body.dateOfBirth !== undefined && {
            dateOfBirth: body.dateOfBirth,
          }),
          ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
          ...(body.summary !== undefined && { summary: body.summary }),
          ...(body.linkedIn !== undefined && { linkedIn: body.linkedIn }),
          ...(body.github !== undefined && { github: body.github }),
          ...(body.web !== undefined && { web: body.web }),
          updatedAt: new Date(),
        })
        .where(eq(resumeProfiles.id, existing.id));

      const updated = await db.query.resumeProfiles.findFirst({
        where: { id: existing.id },
      });

      return {
        success: true,
        data: updated,
      };
    },
    {
      auth: true,
      body: t.Object({
        firstName: t.Optional(t.String({ minLength: 1 })),
        lastName: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(
          t.Object({
            street: t.Optional(t.String()),
            city: t.Optional(t.String()),
            state: t.Optional(t.String()),
            postalCode: t.Optional(t.String()),
            country: t.Optional(t.String()),
          }),
        ),
        nationality: t.Optional(t.String()),
        dateOfBirth: t.Optional(t.String()),
        photoUrl: t.Optional(t.String()),
        summary: t.Optional(t.String()),
        linkedIn: t.Optional(t.String()),
        github: t.Optional(t.String()),
        web: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update resume profile",
      },
    },
  )
  .delete(
    "/",
    async ({ user, set }) => {
      const existing = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      await db
        .delete(resumeProfiles)
        .where(eq(resumeProfiles.id, existing.id));

      return {
        success: true,
        message: "Profile deleted successfully",
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Delete resume profile",
      },
    },
  );
