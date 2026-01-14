import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { workExperiences } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const workExperienceRoutes = new Elysia({
  prefix: "/work-experiences",
})
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

      const experiences = await db.query.workExperiences.findMany({
        where: { profileId: profile.id },
        orderBy: { startDate: "desc" },
      });

      return {
        success: true,
        data: experiences,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all work experiences for user's profile",
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

      await db.insert(workExperiences).values({
        id,
        profileId: profile.id,
        jobTitle: body.jobTitle ?? null,
        employer: body.employer ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        description: body.description ?? null,
        referenceLink: body.referenceLink ?? null,
      });

      const experience = await db.query.workExperiences.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: experience,
      };
    },
    {
      auth: true,
      body: t.Object({
        jobTitle: t.Optional(t.String()),
        employer: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
        description: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add work experience",
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

      const existing = await db.query.workExperiences.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Experience not found" };
      }

      await db
        .update(workExperiences)
        .set({
          ...(body.jobTitle !== undefined && { jobTitle: body.jobTitle }),
          ...(body.employer !== undefined && { employer: body.employer }),
          ...(body.startDate !== undefined && { startDate: body.startDate }),
          ...(body.endDate !== undefined && { endDate: body.endDate }),
          ...(body.city !== undefined && { city: body.city }),
          ...(body.country !== undefined && { country: body.country }),
          ...(body.description !== undefined && {
            description: body.description,
          }),
          ...(body.referenceLink !== undefined && {
            referenceLink: body.referenceLink,
          }),
        })
        .where(eq(workExperiences.id, params.id));

      const updated = await db.query.workExperiences.findFirst({
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
        jobTitle: t.Optional(t.String()),
        employer: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
        description: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update work experience",
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

      const existing = await db.query.workExperiences.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Experience not found" };
      }

      await db.delete(workExperiences).where(eq(workExperiences.id, params.id));

      return {
        success: true,
        message: "Experience deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete work experience",
      },
    },
  );
