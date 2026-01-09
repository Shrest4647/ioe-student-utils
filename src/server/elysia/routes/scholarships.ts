import { and, asc, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@/server/db";
import {
  roundEvents,
  scholarshipRounds,
  scholarships,
  scholarshipsToCountries,
  scholarshipsToDegrees,
  scholarshipsToFields,
} from "@/server/db/schema";
import { authorizationPlugin } from "../plugins/authorization";

export const scholarshipRoutes = new Elysia({ prefix: "/scholarships" })
  .use(authorizationPlugin)
  // --- Taxonomy Endpoints (for filters) ---
  .get(
    "/countries",
    async () => {
      const allCountries = await db.query.countries.findMany({
        orderBy: (countries, { asc }) => [asc(countries.name)],
      });
      return { success: true, data: allCountries };
    },
    {
      detail: { tags: ["Scholarships"], summary: "List all countries" },
    },
  )
  .get(
    "/degrees",
    async () => {
      const allDegrees = await db.query.degreeLevels.findMany({
        orderBy: (degreeLevels, { asc }) => [asc(degreeLevels.rank)],
      });
      return { success: true, data: allDegrees };
    },
    {
      detail: { tags: ["Scholarships"], summary: "List all degree levels" },
    },
  )
  .get(
    "/fields",
    async () => {
      const allFields = await db.query.fieldsOfStudy.findMany({
        orderBy: (fieldsOfStudy, { asc }) => [asc(fieldsOfStudy.name)],
      });
      return { success: true, data: allFields };
    },
    {
      detail: { tags: ["Scholarships"], summary: "List all fields of study" },
    },
  )
  // --- Main Listing Endpoint ---
  .get(
    "/",
    async ({ query }) => {
      const { search, country, degree, field, page, limit } = query;

      const p = Math.max(1, parseInt(page ?? "1", 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit ?? "10", 10) || 12));
      const offset = (p - 1) * l;

      // Build WHERE clause using imported tables and operators
      const conditions = [];

      if (search) {
        conditions.push(ilike(scholarships.name, `%${search}%`));
      }

      // Filter by Country (Many-to-Many)
      if (country) {
        conditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToCountries.scholarshipId })
              .from(scholarshipsToCountries)
              .where(eq(scholarshipsToCountries.countryCode, country)),
          ),
        );
      }

      // Filter by Degree (Many-to-Many)
      if (degree) {
        conditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToDegrees.scholarshipId })
              .from(scholarshipsToDegrees)
              .where(eq(scholarshipsToDegrees.degreeId, degree)),
          ),
        );
      }

      // Filter by Field (Many-to-Many)
      if (field) {
        conditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToFields.scholarshipId })
              .from(scholarshipsToFields)
              .where(eq(scholarshipsToFields.fieldId, field)),
          ),
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db.query.scholarships.findMany({
        where: whereClause as any,
        with: {
          countries: { with: { country: true } },
          degrees: { with: { degree: true } },
          fields: { with: { field: true } },
          rounds: {
            where: eq(scholarshipRounds.isActive, true) as any,
            orderBy: [asc(scholarshipRounds.deadlineDate)] as any,
            limit: 1, // Only show the most comprehensive next deadline
          },
        },
        limit: l,
        offset: offset,
        orderBy: [desc(scholarships.createdAt)] as any,
      });

      // Count total (filtered)
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(scholarships)
        .where(whereClause as any);

      const realTotal = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(realTotal / l);

      return {
        success: true,
        data: results,
        metadata: {
          totalCount: realTotal,
          totalPages,
          currentPage: p,
          limit: l,
          hasMore: p < totalPages,
        },
      };
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        country: t.Optional(t.String()),
        degree: t.Optional(t.String()),
        field: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
      detail: {
        tags: ["Scholarships"],
        summary: "Search and filter scholarships",
      },
    },
  )
  // --- Calendar Events Endpoint ---
  .get(
    "/calendar",
    async ({ query }) => {
      const { start, end } = query;
      // Fetch all active rounds within range
      const events = await db.query.roundEvents.findMany({
        with: {
          round: {
            with: {
              scholarship: true,
            },
          },
        },
        where: and(
          gte(roundEvents.date, new Date(start)),
          lte(roundEvents.date, new Date(end)),
        ) as any,
        orderBy: [asc(roundEvents.date)] as any,
      });

      return { success: true, data: events };
    },
    {
      query: t.Object({
        start: t.String(), // ISO Date string
        end: t.String(),
      }),
      detail: {
        tags: ["Scholarships"],
        summary: "Get scholarship events for calendar",
      },
    },
  )
  // --- Single Detail Endpoint ---
  .get(
    "/:slug",
    async ({ params: { slug }, set }) => {
      const scholarship = await db.query.scholarships.findFirst({
        where: eq(scholarships.slug, slug) as any,
        with: {
          countries: { with: { country: true } },
          degrees: { with: { degree: true } },
          fields: { with: { field: true } },
          rounds: {
            with: {
              events: { orderBy: [asc(roundEvents.date)] as any },
            },
            orderBy: [desc(scholarshipRounds.openDate)] as any,
          },
        },
      });

      if (!scholarship) {
        set.status = 404;
        return { success: false, error: "Scholarship not found" };
      }

      return { success: true, data: scholarship };
    },
    {
      detail: {
        tags: ["Scholarships"],
        summary: "Get scholarship details by slug",
      },
    },
  );
