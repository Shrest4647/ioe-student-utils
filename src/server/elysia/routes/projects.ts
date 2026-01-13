import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { projectRecords, resumeProfiles } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const projectRoutes = new Elysia({ prefix: "/projects" })
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

      const projects = await db.query.projectRecords.findMany({
        where: { profileId: profile.id },
        orderBy: { startDate: "desc" },
      });

      return {
        success: true,
        data: projects,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all projects",
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

      await db.insert(projectRecords).values({
        id,
        profileId: profile.id,
        name: body.name ?? null,
        description: body.description ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        role: body.role ?? null,
        referenceLink: body.referenceLink ?? null,
      });

      const project = await db.query.projectRecords.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: project,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        role: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add project",
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

      const existing = await db.query.projectRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Project not found" };
      }

      await db
        .update(projectRecords)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.startDate !== undefined && { startDate: body.startDate }),
          ...(body.endDate !== undefined && { endDate: body.endDate }),
          ...(body.role !== undefined && { role: body.role }),
          ...(body.referenceLink !== undefined && {
            referenceLink: body.referenceLink,
          }),
        })
        .where(eq(projectRecords.id, params.id));

      const updated = await db.query.projectRecords.findFirst({
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
        description: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        role: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update project",
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

      const existing = await db.query.projectRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Project not found" };
      }

      await db.delete(projectRecords).where(eq(projectRecords.id, params.id));

      return {
        success: true,
        message: "Project deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete project",
      },
    },
  );
