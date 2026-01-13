import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { resumes } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const resumeRoutes = new Elysia({ prefix: "/resumes" })
  .use(authorizationPlugin)
  .get(
    "/mine",
    async ({ user }) => {
      const profile = await db.query.resumeProfiles.findFirst({
        where: { userId: user.id },
      });

      if (!profile) {
        return {
          success: true,
          data: [],
        };
      }

      const userResumes = await db.query.resumes.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: userResumes,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "List all user's resumes",
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

      await db.insert(resumes).values({
        id,
        profileId: profile.id,
        name: body.name,
        includedSections: body.includedSections,
        designTheme: body.designTheme ?? null,
      });

      const resume = await db.query.resumes.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: resume,
      };
    },
    {
      auth: true,
      body: t.Object({
        name: t.String({ minLength: 1 }),
        includedSections: t.Any(), // JSONB array of sections with order
        designTheme: t.Optional(t.Any()), // JSONB metadata for themed rendering
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Create new resume from profile",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, set }) => {
      const resume = await db.query.resumes.findFirst({
        where: { id },
      });

      if (!resume) {
        set.status = 404;
        return { success: false, error: "Resume not found" };
      }

      const profile = await db.query.resumeProfiles.findFirst({
        where: { id: resume.profileId },
      });

      if (!profile) {
        set.status = 404;
        return { success: false, error: "Profile not found" };
      }

      // Fetch all related data manually
      const [
        workExperiences,
        educationRecords,
        projectRecords,
        userSkills,
        languageSkills,
        positionsOfResponsibilityRecords,
        certificationsRecords,
        referencesRecords,
      ] = await Promise.all([
        db.query.workExperiences.findMany({
          where: { profileId: profile.id },
        }),
        db.query.educationRecords.findMany({
          where: { profileId: profile.id },
        }),
        db.query.projectRecords.findMany({
          where: { profileId: profile.id },
        }),
        db.query.userSkills.findMany({
          where: { profileId: profile.id },
        }),
        db.query.languageSkills.findMany({
          where: { profileId: profile.id },
        }),
        db.query.positionsOfResponsibilityRecords.findMany({
          where: { profileId: profile.id },
        }),
        db.query.certificationsRecords.findMany({
          where: { profileId: profile.id },
        }),
        db.query.referencesRecords.findMany({
          where: { profileId: profile.id },
        }),
      ]);

      return {
        success: true,
        data: {
          ...resume,
          profile: {
            ...profile,
            workExperiences,
            educationRecords,
            projectRecords,
            userSkills,
            languageSkills,
            positionsOfResponsibilityRecords,
            certificationsRecords,
            referencesRecords,
          },
        },
      };
    },
    {
      detail: {
        tags: ["Resumes"],
        summary: "Get resume details including all sections",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      const existing = await db.query.resumes.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resume not found" };
      }

      // Authorization check: Profile owner or Admin
      const profile = await db.query.resumeProfiles.findFirst({
        where: { id: existing.profileId },
      });

      if (!profile || (profile.userId !== user.id && user.role !== "admin")) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      await db
        .update(resumes)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.includedSections !== undefined && {
            includedSections: body.includedSections,
          }),
          ...(body.designTheme !== undefined && {
            designTheme: body.designTheme,
          }),
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, id));

      const updated = await db.query.resumes.findFirst({
        where: { id },
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
        name: t.Optional(t.String({ minLength: 1 })),
        includedSections: t.Optional(t.Any()),
        designTheme: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update resume",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const existing = await db.query.resumes.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resume not found" };
      }

      // Authorization check: Profile owner or Admin
      const profile = await db.query.resumeProfiles.findFirst({
        where: { id: existing.profileId },
      });

      if (!profile || (profile.userId !== user.id && user.role !== "admin")) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      await db.delete(resumes).where(eq(resumes.id, id));

      return {
        success: true,
        message: "Resume deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete resume",
      },
    },
  )
  .post(
    "/:id/duplicate",
    async ({ params: { id }, user, set }) => {
      const existing = await db.query.resumes.findFirst({
        where: { id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Resume not found" };
      }

      // Authorization check: Profile owner or Admin
      const profile = await db.query.resumeProfiles.findFirst({
        where: { id: existing.profileId },
      });

      if (!profile || (profile.userId !== user.id && user.role !== "admin")) {
        set.status = 403;
        return { success: false, error: "Unauthorized" };
      }

      const newId = crypto.randomUUID();

      await db.insert(resumes).values({
        id: newId,
        profileId: profile.id,
        name: `${existing.name} (Copy)`,
        includedSections: existing.includedSections,
        designTheme: existing.designTheme,
      });

      const duplicated = await db.query.resumes.findFirst({
        where: { id: newId },
      });

      return {
        success: true,
        data: duplicated,
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Duplicate resume",
      },
    },
  );