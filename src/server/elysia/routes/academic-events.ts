import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { academicEvents } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const academicEventsRoutes = new Elysia({ prefix: "/academic-events" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query, user, set }) => {
      try {
        const { startDate, endDate, eventType } = query;

        // Build conditions array
        const conditions = [eq(academicEvents.userId, user.id)];

        if (startDate) {
          conditions.push(eq(academicEvents.eventDate, startDate));
        }

        if (endDate) {
          conditions.push(eq(academicEvents.eventDate, endDate));
        }

        if (eventType) {
          conditions.push(eq(academicEvents.eventType, eventType));
        }

        const events = await db
          .select()
          .from(academicEvents)
          .where(and(...conditions))
          .orderBy(desc(academicEvents.eventDate));

        return { success: true, data: events };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching academic events:", error);
        return {
          success: false,
          error: "Failed to fetch academic events",
        };
      }
    },
    {
      auth: true,
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        eventType: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Academic Events"],
        summary: "Get all academic events for user",
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        const event = await db.query.academicEvents.findFirst({
          where: {
            AND: [{ id: id }, { userId: user.id }],
          },
        });

        if (!event) {
          set.status = 404;
          return { success: false, error: "Academic event not found" };
        }

        return { success: true, data: event };
      } catch (error) {
        set.status = 500;
        console.error("Error fetching academic event:", error);
        return {
          success: false,
          error: "Failed to fetch academic event",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Academic Events"],
        summary: "Get academic event by ID",
      },
    },
  )
  .post(
    "/",
    async ({ body, user, set }) => {
      try {
        const newEvent = await db
          .insert(academicEvents)
          .values({
            userId: user.id,
            subjectName: body.subjectName,
            eventType: body.eventType,
            title: body.title,
            description: body.description,
            eventDate: body.eventDate,
            eventTime: body.eventTime,
            location: body.location,
          })
          .returning();

        return { success: true, data: newEvent[0] };
      } catch (error) {
        set.status = 500;
        console.error("Error creating academic event:", error);
        return {
          success: false,
          error: "Failed to create academic event",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        subjectName: t.String(),
        eventType: t.String(),
        title: t.String(),
        description: t.Optional(t.String()),
        eventDate: t.String(),
        eventTime: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Academic Events"],
        summary: "Create new academic event",
      },
    },
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      try {
        // First check if event exists and belongs to user
        const existing = await db.query.academicEvents.findFirst({
          where: {
            AND: [{ id: id }, { userId: user.id }],
          },
        });

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Academic event not found" };
        }

        const updateData: Record<string, unknown> = {};

        // Only include fields that are provided
        if (body.subjectName !== undefined)
          updateData.subjectName = body.subjectName;
        if (body.eventType !== undefined) updateData.eventType = body.eventType;
        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined)
          updateData.description = body.description;
        if (body.eventDate !== undefined) updateData.eventDate = body.eventDate;
        if (body.eventTime !== undefined) updateData.eventTime = body.eventTime;
        if (body.location !== undefined) updateData.location = body.location;

        const updated = await db
          .update(academicEvents)
          .set(updateData)
          .where(
            and(eq(academicEvents.id, id), eq(academicEvents.userId, user.id)),
          )
          .returning();

        return { success: true, data: updated[0] };
      } catch (error) {
        set.status = 500;
        console.error("Error updating academic event:", error);
        return {
          success: false,
          error: "Failed to update academic event",
        };
      }
    },
    {
      auth: true,
      body: t.Object({
        subjectName: t.Optional(t.String()),
        eventType: t.Optional(t.String()),
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
        eventDate: t.Optional(t.String()),
        eventTime: t.Optional(t.String()),
        location: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Academic Events"],
        summary: "Update academic event",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      try {
        // First check if event exists and belongs to user
        const existing = await db.query.academicEvents.findFirst({
          where: {
            AND: [{ id: id }, { userId: user.id }],
          },
        });

        if (!existing) {
          set.status = 404;
          return { success: false, error: "Academic event not found" };
        }

        await db
          .delete(academicEvents)
          .where(
            and(eq(academicEvents.id, id), eq(academicEvents.userId, user.id)),
          );

        return { success: true };
      } catch (error) {
        set.status = 500;
        console.error("Error deleting academic event:", error);
        return {
          success: false,
          error: "Failed to delete academic event",
        };
      }
    },
    {
      auth: true,
      detail: {
        tags: ["Academic Events"],
        summary: "Delete academic event",
      },
    },
  );
