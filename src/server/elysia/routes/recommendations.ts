import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { recommendationLetter, studentProfileData } from "@/server/db/schema";
import {
  generateDefaultContext,
  preFillWithProfileData,
  replaceTemplateVariables,
} from "@/server/lib/template-engine";
import { authorizationPlugin } from "../plugins/authorization";

export const recommendationRoutes = new Elysia({
  prefix: "/recommendations",
})
  .use(authorizationPlugin)
  // ============================================================
  // TEMPLATE MANAGEMENT ROUTES
  // ============================================================

  .get(
    "/templates",
    async ({ query }) => {
      const { category, targetProgramType, targetRegion, isActive } = query;

      const conditions = [];

      if (category) {
        conditions.push({ category: category });
      }
      if (targetProgramType) {
        conditions.push({ targetProgramType: targetProgramType });
      }
      if (targetRegion) {
        conditions.push({ targetRegion: targetRegion });
      }
      if (isActive !== undefined) {
        conditions.push({ isActive: isActive });
      }

      const templates = await db.query.recommendationTemplate.findMany({
        where: {
          AND: [...conditions],
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        success: true,
        data: templates,
      };
    },
    {
      detail: {
        tags: ["Recommendations", "Templates"],
        summary: "List all recommendation templates",
      },
      query: t.Object({
        category: t.Optional(
          t.Union([
            t.Literal("research"),
            t.Literal("academic"),
            t.Literal("industry"),
            t.Literal("general"),
            t.Literal("country_specific"),
          ]),
        ),
        targetProgramType: t.Optional(
          t.Union([
            t.Literal("phd"),
            t.Literal("masters"),
            t.Literal("job"),
            t.Literal("funding"),
            t.Literal("any"),
          ]),
        ),
        targetRegion: t.Optional(
          t.Union([
            t.Literal("us"),
            t.Literal("uk"),
            t.Literal("eu"),
            t.Literal("asia"),
            t.Literal("global"),
          ]),
        ),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )

  .get(
    "/templates/:id",
    async ({ params, set }) => {
      const template = await db.query.recommendationTemplate.findFirst({
        where: { id: params.id },
      });

      if (!template) {
        set.status = 404;
        return {
          success: false,
          error: "Template not found",
        };
      }

      return {
        success: true,
        data: template,
      };
    },
    {
      detail: {
        tags: ["Recommendations", "Templates"],
        summary: "Get a single template by ID",
      },
    },
  )

  // ============================================================
  // LETTER MANAGEMENT ROUTES
  // ============================================================

  .get(
    "/letters",
    async ({ user, query }) => {
      const { status, templateId, page = 1, limit = 20 } = query;

      const letters = await db.query.recommendationLetter.findMany({
        where: {
          AND: [
            { studentId: user.id },
            status ? { status } : {},
            templateId ? { templateId } : {},
          ],
        },
        orderBy: { createdAt: "desc" },
        limit,
        offset: (page - 1) * limit,
      });

      return {
        success: true,
        data: letters,
        meta: {
          page,
          limit,
          total: letters.length,
        },
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Letters"],
        summary: "List all user's recommendation letters",
      },
      query: t.Object({
        status: t.Optional(
          t.Union([
            t.Literal("draft"),
            t.Literal("completed"),
            t.Literal("exported"),
          ]),
        ),
        templateId: t.Optional(t.String()),
        page: t.Optional(t.Numeric()),
        limit: t.Optional(t.Numeric()),
      }),
    },
  )

  .get(
    "/letters/:id",
    async ({ user, params, set }) => {
      const letter = await db.query.recommendationLetter.findFirst({
        where: { id: params.id },
      });

      if (!letter) {
        set.status = 404;
        return {
          success: false,
          error: "Letter not found",
        };
      }

      // Authorization: user can only access their own letters
      if (letter.studentId !== user.id) {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to access this letter",
        };
      }

      return {
        success: true,
        data: letter,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Letters"],
        summary: "Get a single letter by ID",
      },
    },
  )

  .post(
    "/letters",
    async ({ user, body, set }) => {
      // 1. Validate template exists
      const template = await db.query.recommendationTemplate.findFirst({
        where: { id: body.templateId },
      });

      if (!template) {
        set.status = 404;
        return {
          success: false,
          error: "Template not found",
        };
      }

      // 2. Get user's profile data for smart pre-filling
      const profileData = await db.query.studentProfileData.findFirst({
        where: { userId: user.id },
      });

      // 3. Build context from form data
      const formData = {
        // Recommender info
        your_name: body.recommenderName,
        your_title: body.recommenderTitle,
        your_institution: body.recommenderInstitution,
        your_email: body.recommenderEmail,
        your_department: body.recommenderDepartment,

        // Target info
        target_institution: body.targetInstitution,
        target_program: body.targetProgram,
        target_department: body.targetDepartment,
        target_country: body.targetCountry,
        purpose: body.purpose,

        // Relationship
        relationship: body.relationship,
        context_of_meeting: body.contextOfMeeting,

        // Student info
        student_achievements: body.studentAchievements,
        research_experience: body.researchExperience,
        academic_performance: body.academicPerformance,
        personal_qualities: body.personalQualities,
        custom_content: body.customContent,
      };

      // 4. Generate default context from template variables
      let context = generateDefaultContext(template.variables, {
        name: user.name,
        email: user.email,
      });

      // 5. Pre-fill with profile data
      if (profileData) {
        context = preFillWithProfileData(context, profileData);
      }

      // 6. Merge with form data
      context = {
        ...context,
        ...formData,
      };

      // 7. Generate final content by replacing variables
      const finalContent = replaceTemplateVariables(template.content, context);

      // 8. Save to database
      const id = crypto.randomUUID();

      await db.insert(recommendationLetter).values({
        id,
        title: body.title,
        studentId: user.id,
        templateId: body.templateId,

        // Recommender Information
        recommenderName: body.recommenderName,
        recommenderTitle: body.recommenderTitle,
        recommenderInstitution: body.recommenderInstitution,
        recommenderEmail: body.recommenderEmail,
        recommenderDepartment: body.recommenderDepartment,

        // Target Information
        targetInstitution: body.targetInstitution,
        targetProgram: body.targetProgram,
        targetDepartment: body.targetDepartment,
        targetCountry: body.targetCountry,
        purpose: body.purpose,

        // Relationship & Context
        relationship: body.relationship,
        contextOfMeeting: body.contextOfMeeting,

        // Student Information
        studentAchievements: body.studentAchievements,
        researchExperience: body.researchExperience,
        academicPerformance: body.academicPerformance,
        personalQualities: body.personalQualities,
        customContent: body.customContent,

        // Generated Content
        finalContent,
        status: "draft",
      });

      // 9. Fetch and return the created letter
      const letter = await db.query.recommendationLetter.findFirst({
        where: { id: id },
      });

      return {
        success: true,
        data: letter,
      };
    },
    {
      auth: true,
      body: t.Object({
        templateId: t.String(),
        title: t.String({ minLength: 1 }),
        recommenderName: t.String({ minLength: 1 }),
        recommenderTitle: t.String({ minLength: 1 }),
        recommenderInstitution: t.String({ minLength: 1 }),
        recommenderEmail: t.Optional(t.String()),
        recommenderDepartment: t.Optional(t.String()),
        targetInstitution: t.String({ minLength: 1 }),
        targetProgram: t.String({ minLength: 1 }),
        targetDepartment: t.Optional(t.String()),
        targetCountry: t.String({ minLength: 1 }),
        purpose: t.String({ minLength: 1 }),
        relationship: t.String({ minLength: 1 }),
        contextOfMeeting: t.Optional(t.String()),
        studentAchievements: t.Optional(t.String()),
        researchExperience: t.Optional(t.String()),
        academicPerformance: t.Optional(t.String()),
        personalQualities: t.Optional(t.String()),
        customContent: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Letters"],
        summary: "Create a new recommendation letter",
      },
    },
  )

  .put(
    "/letters/:id",
    async ({ user, params, body, set }) => {
      // 1. Check if letter exists and belongs to user
      const existingLetter = await db.query.recommendationLetter.findFirst({
        where: { id: params.id },
      });

      if (!existingLetter) {
        set.status = 404;
        return {
          success: false,
          error: "Letter not found",
        };
      }

      if (existingLetter.studentId !== user.id) {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to update this letter",
        };
      }

      // 2. Update the letter
      await db
        .update(recommendationLetter)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(eq(recommendationLetter.id, params.id));

      // 3. Fetch and return the updated letter
      const letter = await db.query.recommendationLetter.findFirst({
        where: { id: params.id },
      });

      return {
        success: true,
        data: letter,
      };
    },
    {
      auth: true,
      body: t.Partial(
        t.Object({
          title: t.Optional(t.String()),
          recommenderName: t.Optional(t.String()),
          recommenderTitle: t.Optional(t.String()),
          recommenderInstitution: t.Optional(t.String()),
          recommenderEmail: t.Optional(t.String()),
          recommenderDepartment: t.Optional(t.String()),
          targetInstitution: t.Optional(t.String()),
          targetProgram: t.Optional(t.String()),
          targetDepartment: t.Optional(t.String()),
          targetCountry: t.Optional(t.String()),
          purpose: t.Optional(t.String()),
          relationship: t.Optional(t.String()),
          contextOfMeeting: t.Optional(t.String()),
          studentAchievements: t.Optional(t.String()),
          researchExperience: t.Optional(t.String()),
          academicPerformance: t.Optional(t.String()),
          personalQualities: t.Optional(t.String()),
          customContent: t.Optional(t.String()),
          finalContent: t.Optional(t.String()),
          status: t.Optional(
            t.Union([
              t.Literal("draft"),
              t.Literal("completed"),
              t.Literal("exported"),
            ]),
          ),
          pdfUrl: t.Optional(t.String()),
          googleDocUrl: t.Optional(t.String()),
        }),
      ),
      detail: {
        tags: ["Recommendations", "Letters"],
        summary: "Update a recommendation letter",
      },
    },
  )

  .delete(
    "/letters/:id",
    async ({ user, params, set }) => {
      // 1. Check if letter exists and belongs to user
      const existingLetter = await db.query.recommendationLetter.findFirst({
        where: { id: params.id },
      });

      if (!existingLetter) {
        set.status = 404;
        return {
          success: false,
          error: "Letter not found",
        };
      }

      if (existingLetter.studentId !== user.id) {
        set.status = 403;
        return {
          success: false,
          error: "You don't have permission to delete this letter",
        };
      }

      // 2. Delete the letter
      await db
        .delete(recommendationLetter)
        .where(eq(recommendationLetter.id, params.id));

      return {
        success: true,
        message: "Letter deleted successfully",
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Letters"],
        summary: "Delete a recommendation letter",
      },
    },
  )

  // ============================================================
  // STUDENT PROFILE DATA ROUTES
  // ============================================================

  .get(
    "/profile",
    async ({ user }) => {
      const profile = await db.query.studentProfileData.findFirst({
        where: { userId: user.id },
      });

      return {
        success: true,
        data: profile || null,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Profile"],
        summary: "Get student profile data",
      },
    },
  )

  .put(
    "/profile",
    async ({ user, body }) => {
      const existing = await db.query.studentProfileData.findFirst({
        where: { userId: user.id },
      });

      if (existing) {
        // Update existing profile
        await db
          .update(studentProfileData)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(studentProfileData.id, existing.id));

        const profile = await db.query.studentProfileData.findFirst({
          where: { id: existing.id },
        });

        return {
          success: true,
          data: profile,
        };
      } else {
        // Create new profile
        const id = crypto.randomUUID();

        await db.insert(studentProfileData).values({
          id,
          userId: user.id,
          ...body,
        });

        const profile = await db.query.studentProfileData.findFirst({
          where: { id: id },
        });

        return {
          success: true,
          data: profile,
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        gpa: t.Optional(t.String()),
        major: t.Optional(t.String()),
        minor: t.Optional(t.String()),
        expectedGraduation: t.Optional(t.String()),
        researchInterests: t.Optional(t.String()),
        skills: t.Optional(t.String()),
        achievements: t.Optional(t.String()),
        projects: t.Optional(t.String()),
        workExperience: t.Optional(t.String()),
        extracurricular: t.Optional(t.String()),
        careerGoals: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Profile"],
        summary: "Update or create student profile data",
      },
    },
  );
