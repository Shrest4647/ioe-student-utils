import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import {
  savedRecommender,
  savedTargetInstitution,
  savedTemplateVariables,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const savedRecommendationsRoutes = new Elysia({
  prefix: "/recommendations/saved",
})
  .use(authorizationPlugin)
  // ============================================
  // SAVED RECOMMENDERS
  // ============================================

  // List all saved recommenders for current user
  .get(
    "/recommenders",
    async ({ user }) => {
      const recommenders = await db.query.savedRecommender.findMany({
        where: {
          AND: [{ userId: user.id }, { isActive: true }],
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        success: true,
        data: recommenders,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "List all saved recommenders",
      },
    },
  )

  // Get single saved recommender
  .get(
    "/recommenders/:id",
    async ({ user, params, set }) => {
      const recommender = await db.query.savedRecommender.findFirst({
        where: { id: params.id, isActive: true },
      });

      if (!recommender) {
        set.status = 404;
        return { success: false, error: "Recommender not found" };
      }

      if (recommender.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      return { success: true, data: recommender };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Get a single saved recommender",
      },
    },
  )

  // Create saved recommender
  .post(
    "/recommenders",
    async ({ user, body }) => {
      const id = crypto.randomUUID();

      await db.insert(savedRecommender).values({
        id,
        userId: user.id,
        name: body.name,
        title: body.title,
        institution: body.institution,
        department: body.department,
        email: body.email,
        phone: body.phone,
        relationship: body.relationship,
        contextOfMeeting: body.contextOfMeeting,
      });

      const recommender = await db.query.savedRecommender.findFirst({
        where: { id },
      });

      return { success: true, data: recommender };
    },
    {
      auth: true,
      body: t.Object({
        name: t.String({ minLength: 1 }),
        title: t.String({ minLength: 1 }),
        institution: t.String({ minLength: 1 }),
        department: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        relationship: t.Optional(t.String()),
        contextOfMeeting: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Create a new saved recommender",
      },
    },
  )

  // Update saved recommender
  .put(
    "/recommenders/:id",
    async ({ user, params, body, set }) => {
      const existing = await db.query.savedRecommender.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedRecommender)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(savedRecommender.id, params.id));

      const recommender = await db.query.savedRecommender.findFirst({
        where: { id: params.id },
      });

      return { success: true, data: recommender };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        title: t.Optional(t.String()),
        institution: t.Optional(t.String()),
        department: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        relationship: t.Optional(t.String()),
        contextOfMeeting: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Update a saved recommender",
      },
    },
  )

  // Delete saved recommender (soft delete)
  .delete(
    "/recommenders/:id",
    async ({ user, params, set }) => {
      const existing = await db.query.savedRecommender.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedRecommender)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(savedRecommender.id, params.id));

      return { success: true, message: "Deleted successfully" };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Delete a saved recommender",
      },
    },
  )

  // ============================================
  // SAVED TARGET INSTITUTIONS
  // ============================================

  // List all saved target institutions
  .get(
    "/institutions",
    async ({ user }) => {
      const institutions = await db.query.savedTargetInstitution.findMany({
        where: {
          AND: [{ userId: user.id }, { isActive: true }],
        },
        orderBy: { updatedAt: "desc" },
      });

      return {
        success: true,
        data: institutions,
      };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "List all saved target institutions",
      },
    },
  )

  // Get single saved institution
  .get(
    "/institutions/:id",
    async ({ user, params, set }) => {
      const institution = await db.query.savedTargetInstitution.findFirst({
        where: { id: params.id, isActive: true },
      });

      if (!institution) {
        set.status = 404;
        return { success: false, error: "Institution not found" };
      }

      if (institution.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      return { success: true, data: institution };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Get a single saved target institution",
      },
    },
  )

  // Create saved institution
  .post(
    "/institutions",
    async ({ user, body }) => {
      const id = crypto.randomUUID();

      await db.insert(savedTargetInstitution).values({
        id,
        userId: user.id,
        institution: body.institution,
        program: body.program,
        department: body.department,
        country: body.country,
        purpose: body.purpose,
      });

      const institution = await db.query.savedTargetInstitution.findFirst({
        where: { id },
      });

      return { success: true, data: institution };
    },
    {
      auth: true,
      body: t.Object({
        institution: t.String({ minLength: 1 }),
        program: t.Optional(t.String()),
        department: t.Optional(t.String()),
        country: t.String({ minLength: 1 }),
        purpose: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Create a new saved target institution",
      },
    },
  )

  // Update saved institution
  .put(
    "/institutions/:id",
    async ({ user, params, body, set }) => {
      const existing = await db.query.savedTargetInstitution.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedTargetInstitution)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(savedTargetInstitution.id, params.id));

      const institution = await db.query.savedTargetInstitution.findFirst({
        where: { id: params.id },
      });

      return { success: true, data: institution };
    },
    {
      auth: true,
      body: t.Object({
        institution: t.Optional(t.String()),
        program: t.Optional(t.String()),
        department: t.Optional(t.String()),
        country: t.Optional(t.String()),
        purpose: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Update a saved target institution",
      },
    },
  )

  // Delete saved institution (soft delete)
  .delete(
    "/institutions/:id",
    async ({ user, params, set }) => {
      const existing = await db.query.savedTargetInstitution.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedTargetInstitution)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(savedTargetInstitution.id, params.id));

      return { success: true, message: "Deleted successfully" };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Delete a saved target institution",
      },
    },
  )

  // ============================================
  // SAVED TEMPLATE VARIABLES
  // ============================================

  // List all saved template variables for current user and template
  .get(
    "/template-variables",
    async ({ user, query }) => {
      const whereClause: any = {
        AND: [{ userId: user.id }, { isActive: true }],
      };

      // Filter by templateId if provided
      if (query.templateId) {
        whereClause.AND.push({ templateId: query.templateId });
      }

      const savedVariablesList = await db.query.savedTemplateVariables.findMany(
        {
          where: whereClause,
          orderBy: { updatedAt: "desc" },
        },
      );

      return {
        success: true,
        data: savedVariablesList,
      };
    },
    {
      auth: true,
      query: t.Object({
        templateId: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "List all saved template variables",
      },
    },
  )

  // Get single saved template variable set
  .get(
    "/template-variables/:id",
    async ({ user, params, set }) => {
      const savedVars = await db.query.savedTemplateVariables.findFirst({
        where: { id: params.id, isActive: true },
      });

      if (!savedVars) {
        set.status = 404;
        return { success: false, error: "Saved variables not found" };
      }

      if (savedVars.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      return { success: true, data: savedVars };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Get a single saved template variable set",
      },
    },
  )

  // Create saved template variables
  .post(
    "/template-variables",
    async ({ user, body }) => {
      const id = crypto.randomUUID();

      await db.insert(savedTemplateVariables).values({
        id,
        userId: user.id,
        templateId: body.templateId,
        name: body.name,
        variables: body.variables,
      });

      const savedVars = await db.query.savedTemplateVariables.findFirst({
        where: { id },
      });

      return { success: true, data: savedVars };
    },
    {
      auth: true,
      body: t.Object({
        templateId: t.String({ minLength: 1 }),
        name: t.String({ minLength: 1 }),
        variables: t.Any(), // JSON object with variable values
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Create a new saved template variable set",
      },
    },
  )

  // Update saved template variables
  .put(
    "/template-variables/:id",
    async ({ user, params, body, set }) => {
      const existing = await db.query.savedTemplateVariables.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedTemplateVariables)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(savedTemplateVariables.id, params.id));

      const savedVars = await db.query.savedTemplateVariables.findFirst({
        where: { id: params.id },
      });

      return { success: true, data: savedVars };
    },
    {
      auth: true,
      body: t.Object({
        name: t.Optional(t.String()),
        variables: t.Optional(t.Any()),
      }),
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Update a saved template variable set",
      },
    },
  )

  // Delete saved template variables (soft delete)
  .delete(
    "/template-variables/:id",
    async ({ user, params, set }) => {
      const existing = await db.query.savedTemplateVariables.findFirst({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Not found" };
      }

      if (existing.userId !== user.id) {
        set.status = 403;
        return { success: false, error: "Forbidden" };
      }

      await db
        .update(savedTemplateVariables)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(savedTemplateVariables.id, params.id));

      return { success: true, message: "Deleted successfully" };
    },
    {
      auth: true,
      detail: {
        tags: ["Recommendations", "Saved"],
        summary: "Delete a saved template variable set",
      },
    },
  );
