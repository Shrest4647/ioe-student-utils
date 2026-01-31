import { and, eq, desc } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import { academicEvents } from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const academicEventsRoutes = new Elysia({ prefix: "/academic-events" })
  .use(authorizationPlugin)
  .get(
    "/",
    async ({ query, user }) => {
      const { startDate, endDate, eventType } = query;

      // Build conditions array
      const conditions = [eq(academicEvents.userId, user.id)];

      if (startDate) {
        conditions.push(
          and(
            eq(academicEvents.userId, user.id),
            // @ts-ignore - drizzle ORM type
            eq(academicEvents.eventDate, startDate)
          )
        );
      }

      if (endDate) {
        conditions.push(
          and(
            eq(academicEvents.userId, user.id),
            // @ts-ignore - drizzle ORM type
            eq(academicEvents.eventDate, endDate)
          )
        );
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
    },
    {
      query: t.Object({
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
        eventType: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Academic Events"],
        summary: "Get all academic events for user",
      },
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, user, set }) => {
      const event = await db.query.academicEvents.findFirst({
        where: and(
          eq(academicEvents.id, id),
          eq(academicEvents.userId, user.id)
        ),
      });

      if (!event) {
        set.status = 404;
        return { success: false, error: "Academic event not found" };
      }

      return { success: true, data: event };
    },
    {
      detail: {
        tags: ["Academic Events"],
        summary: "Get academic event by ID",
      },
    }
  )
  .post(
    "/",
    async ({ body, user }) => {
      const newEvent = await db
        .insert(academicEvents)
        .values({
          ...body,
          userId: user.id,
          eventDate: new Date(body.eventDate),
        })
        .returning();

      return { success: true, data: newEvent[0] };
    },
    {
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
    }
  )
  .patch(
    "/:id",
    async ({ params: { id }, body, user, set }) => {
      // First check if event exists and belongs to user
      const existing = await db.query.academicEvents.findFirst({
        where: and(
          eq(academicEvents.id, id),
          eq(academicEvents.userId, user.id)
        ),
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Academic event not found" };
      }

      const updateData: any = { ...body };

      // Convert eventDate string to Date if provided
      if (body.eventDate) {
        updateData.eventDate = new Date(body.eventDate);
      }

      const updated = await db
        .update(academicEvents)
        .set(updateData)
        .where(and(eq(academicEvents.id, id), eq(academicEvents.userId, user.id)))
        .returning();

      return { success: true, data: updated[0] };
    },
    {
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
    }
  )
  .delete(
    "/:id",
    async ({ params: { id }, user, set }) => {
      // First check if event exists and belongs to user
      const existing = await db.query.academicEvents.findFirst({
        where: and(
          eq(academicEvents.id, id),
          eq(academicEvents.userId, user.id)
        ),
      });

      if (!existing) {
        set.status = 404;
        return { success: false, error: "Academic event not found" };
      }

      await db
        .delete(academicEvents)
        .where(and(eq(academicEvents.id, id), eq(academicEvents.userId, user.id)));

      return { success: true };
    },
    {
      detail: {
        tags: ["Academic Events"],
        summary: "Delete academic event",
      },
    }
  );
