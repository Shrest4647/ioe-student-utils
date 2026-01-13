import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { educationRecords, resumeProfiles } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const educationRoutes = new Elysia({ prefix: "/education" })
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

      const education = await db.query.educationRecords.findMany({
        where: { profileId: profile.id },
        orderBy: { startDate: "desc" },
      });

      return {
        success: true,
        data: education,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Resumes"],
        summary: "Get all education records",
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

      await db.insert(educationRecords).values({
        id,
        profileId: profile.id,
        institution: body.institution ?? null,
        qualification: body.qualification ?? null,
        degreeLevel: body.degreeLevel ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        graduationDate: body.graduationDate ?? null,
        grade: body.grade ?? null,
        gradeType: body.gradeType ?? null,
        description: body.description ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        referenceLink: body.referenceLink ?? null,
      });

      const record = await db.query.educationRecords.findFirst({
        where: { id },
      });

      return {
        success: true,
        data: record,
      };
    },
    {
      auth: true,
      body: t.Object({
        institution: t.Optional(t.String()),
        qualification: t.Optional(t.String()),
        degreeLevel: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        graduationDate: t.Optional(t.String()),
        grade: t.Optional(t.String()),
        gradeType: t.Optional(t.String()),
        description: t.Optional(t.String()),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Add education record",
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

      const existing = await db.query.educationRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Education record not found" };
      }

      await db
        .update(educationRecords)
        .set({
          ...(body.institution !== undefined && { institution: body.institution }),
          ...(body.qualification !== undefined && {
            qualification: body.qualification,
          }),
          ...(body.degreeLevel !== undefined && {
            degreeLevel: body.degreeLevel,
          }),
          ...(body.startDate !== undefined && { startDate: body.startDate }),
          ...(body.endDate !== undefined && { endDate: body.endDate }),
          ...(body.graduationDate !== undefined && {
            graduationDate: body.graduationDate,
          }),
          ...(body.grade !== undefined && { grade: body.grade }),
          ...(body.gradeType !== undefined && { gradeType: body.gradeType }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.city !== undefined && { city: body.city }),
          ...(body.country !== undefined && { country: body.country }),
          ...(body.referenceLink !== undefined && {
            referenceLink: body.referenceLink,
          }),
        })
        .where(eq(educationRecords.id, params.id));

      const updated = await db.query.educationRecords.findFirst({
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
        institution: t.Optional(t.String()),
        qualification: t.Optional(t.String()),
        degreeLevel: t.Optional(t.String()),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        graduationDate: t.Optional(t.String()),
        grade: t.Optional(t.String()),
        gradeType: t.Optional(t.String()),
        description: t.Optional(t.String()),
        city: t.Optional(t.String()),
        country: t.Optional(t.String()),
        referenceLink: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Update education record",
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

      const existing = await db.query.educationRecords.findFirst({
        where: { id: params.id },
      });

      if (!existing || existing.profileId !== profile.id) {
        set.status = 404;
        return { success: false, error: "Education record not found" };
      }

      await db.delete(educationRecords).where(eq(educationRecords.id, params.id));

      return {
        success: true,
        message: "Education record deleted successfully",
      };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
      detail: {
        tags: ["Resumes"],
        summary: "Delete education record",
      },
    },
  );
