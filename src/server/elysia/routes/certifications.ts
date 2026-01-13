import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { certificationsRecords } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const certificationRoutes = new Elysia({ prefix: "/certifications" })
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

      const certifications = await db.query.certificationsRecords.findMany({
        where: { profileId: profile.id },
        orderBy: { issueDate: "desc" },
      });

      return {
        success: true,
        data: certifications,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all certifications",
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

      await db.insert(certificationsRecords).values({
        id,
        profileId: profile.id,
        name: body.name ?? null,
        issuer: body.issuer ?? null,
        issueDate: body.issueDate ?? null,
        credentialUrl: body.credentialUrl ?? null,
      });

      const certification = await db.query.certificationsRecords.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: certification,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        issuer: t.Optional(t.String()),
        issueDate: t.Optional(t.String()),
        credentialUrl: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add certification",
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

      const existing = await db.query.certificationsRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Certification not found" };
      }

      await db
        .update(certificationsRecords)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.issuer !== undefined && { issuer: body.issuer }),
          ...(body.issueDate !== undefined && { issueDate: body.issueDate }),
          ...(body.credentialUrl !== undefined && {
            credentialUrl: body.credentialUrl,
          }),
        })
        .where(eq(certificationsRecords.id, params.id));

      const updated = await db.query.certificationsRecords.findFirst({
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
        issuer: t.Optional(t.String()),
        issueDate: t.Optional(t.String()),
        credentialUrl: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update certification",
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

      const existing = await db.query.certificationsRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Certification not found" };
      }

      await db
        .delete(certificationsRecords)
        .where(eq(certificationsRecords.id, params.id));

      return {
        success: true,
        message: "Certification deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete certification",
      },
    },
  );
