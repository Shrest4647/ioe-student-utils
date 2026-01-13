import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { resumeProfiles, userSkills } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const skillRoutes = new Elysia({ prefix: "/skills" })
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

      const skills = await db.query.userSkills.findMany({
        where: { profileId: profile.id },
      });

      return {
        success: true,
        data: skills,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all skills for user's profile",
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

      await db.insert(userSkills).values({
        id,
        profileId: profile.id,
        category: body.category,
        skills: body.skills,
      });

      const skill = await db.query.userSkills.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: skill,
      };
    },
    {
      auth: true,
      body: t.Object({
        category: t.String({ minLength: 1 }),
        skills: t.Any(), // JSONB array
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add skill category",
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

      const existing = await db.query.userSkills.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Skill not found" };
      }

      await db
        .update(userSkills)
        .set({
          ...(body.category !== undefined && { category: body.category }),
          ...(body.skills !== undefined && { skills: body.skills }),
        })
        .where(eq(userSkills.id, params.id));

      const updated = await db.query.userSkills.findFirst({
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
        category: t.Optional(t.String()),
        skills: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update skill category",
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

      const existing = await db.query.userSkills.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Skill not found" };
      }

      await db.delete(userSkills).where(eq(userSkills.id, params.id));

      return {
        success: true,
        message: "Skill deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete skill category",
      },
    },
  );
