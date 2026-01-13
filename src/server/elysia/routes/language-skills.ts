import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { languageSkills, resumeProfiles } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const languageSkillRoutes = new Elysia({ prefix: "/language-skills" })
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

      const languageSkillsList = await db.query.languageSkills.findMany({
        where: { profileId: profile.id },
      });

      return {
        success: true,
        data: languageSkillsList,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all language skills",
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

      await db.insert(languageSkills).values({
        id,
        profileId: profile.id,
        language: body.language,
        listening: body.listening ?? null,
        reading: body.reading ?? null,
        speaking: body.speaking ?? null,
        writing: body.writing ?? null,
        referenceLink: body.referenceLink ?? null,
      });

      const languageSkill = await db.query.languageSkills.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: languageSkill,
      };
    },
    {
      auth: true,
      body: t.Object({
        language: t.String({ minLength: 1 }),
        listening: t.Optional(t.String()),
        reading: t.Optional(t.String()),
        speaking: t.Optional(t.String()),
        writing: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add language skill",
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

      const existing = await db.query.languageSkills.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Language skill not found" };
      }

      await db
        .update(languageSkills)
        .set({
          ...(body.language !== undefined && { language: body.language }),
          ...(body.listening !== undefined && { listening: body.listening }),
          ...(body.reading !== undefined && { reading: body.reading }),
          ...(body.speaking !== undefined && { speaking: body.speaking }),
          ...(body.writing !== undefined && { writing: body.writing }),
          ...(body.referenceLink !== undefined && {
            referenceLink: body.referenceLink,
          }),
        })
        .where(eq(languageSkills.id, params.id));

      const updated = await db.query.languageSkills.findFirst({
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
        language: t.Optional(t.String()),
        listening: t.Optional(t.String()),
        reading: t.Optional(t.String()),
        speaking: t.Optional(t.String()),
        writing: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update language skill",
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

      const existing = await db.query.languageSkills.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Language skill not found" };
      }

      await db.delete(languageSkills).where(eq(languageSkills.id, params.id));

      return {
        success: true,
        message: "Language skill deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete language skill",
      },
    },
  );
