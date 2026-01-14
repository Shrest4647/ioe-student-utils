import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { referencesRecords } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const referenceRoutes = new Elysia({ prefix: "/references" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ user, set }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      const references = await db.query.referencesRecords.findMany({
        where: { profileId: profile.id },
      });

      return {
        success: true,
        data: references,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all references",
      },
    },
  )
  .post(
    "/",
    async ({ user, body, set }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      const id = crypto.randomUUID();

      await db.insert(referencesRecords).values({
        id,
        profileId: profile.id,
        name: body.name ?? null,
        title: body.title ?? null,
        relation: body.relation ?? null,
        institution: body.institution ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
      });

      const reference = await db.query.referencesRecords.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: reference,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        title: t.Optional(t.String()),
        relation: t.Optional(t.String()),
        institution: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add reference",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params, body, user, set }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      const existing = await db.query.referencesRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Reference not found" };
      }

      await db
        .update(referencesRecords)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.title !== undefined && { title: body.title }),
          ...(body.relation !== undefined && { relation: body.relation }),
          ...(body.institution !== undefined && {
            institution: body.institution,
          }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.phone !== undefined && { phone: body.phone }),
        })
        .where(eq(referencesRecords.id, params.id));

      const updated = await db.query.referencesRecords.findFirst({
        where: { id: params.id },
      });

      return {
        success: true,
        data: updated,
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        title: t.Optional(t.String()),
        relation: t.Optional(t.String()),
        institution: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update reference",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params, user, set }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      const existing = await db.query.referencesRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Reference not found" };
      }

      await db
        .delete(referencesRecords)
        .where(eq(referencesRecords.id, params.id));

      return {
        success: true,
        message: "Reference deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete reference",
      },
    },
  );
