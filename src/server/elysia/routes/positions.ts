import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { positionsOfResponsibilityRecords } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const positionRoutes = new Elysia({ prefix: "/positions" })
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

      const positions =
        await db.query.positionsOfResponsibilityRecords.findMany({
          where: { profileId: profile.id },
          orderBy: { startDate: "desc" },
        });

      return {
        success: true,
        data: positions,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all positions of responsibility",
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

      await db.insert(positionsOfResponsibilityRecords).values({
        id,
        profileId: profile.id,
        name: body.name ?? null,
        description: body.description ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        referenceLink: body.referenceLink ?? null,
      });

      const position =
        await db.query.positionsOfResponsibilityRecords.findFirst({
          where: { id },
        });

      return {
        success: true,
        data: position,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add position of responsibility",
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

      const existing =
        await db.query.positionsOfResponsibilityRecords.findFirst({
          where: { id: params.id },
        });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Position not found" };
      }

      await db
        .update(positionsOfResponsibilityRecords)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && {
            description: body.description,
          }),
          ...(body.startDate !== undefined && { startDate: body.startDate }),
          ...(body.endDate !== undefined && { endDate: body.endDate }),
          ...(body.referenceLink !== undefined && {
            referenceLink: body.referenceLink,
          }),
        })
        .where(eq(positionsOfResponsibilityRecords.id, params.id));

      const updated = await db.query.positionsOfResponsibilityRecords.findFirst(
        {
          where: { id: params.id },
        },
      );

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
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update position of responsibility",
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

      const existing =
        await db.query.positionsOfResponsibilityRecords.findFirst({
          where: { id: params.id },
        });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Position not found" };
      }

      await db
        .delete(positionsOfResponsibilityRecords)
        .where(eq(positionsOfResponsibilityRecords.id, params.id));

      return {
        success: true,
        message: "Position deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete position of responsibility",
      },
    },
  );
