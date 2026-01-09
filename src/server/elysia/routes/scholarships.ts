import { and, eq, ilike, inArray, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import { db } from "@/server/db";
import {
  countries,
  degreeLevels,
  fieldsOfStudy,
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

      const results = await db.query.scholarships.findMany({
        where: (() => {
          const conditions = [];

          if (search) {
            conditions.push({
              OR: [
                {
                  name: {
                    ilike: `%${search}%`,
                  },
                },
                {
                  description: {
                    ilike: `%${search}%`,
                  },
                },
                {
                  providerName: {
                    ilike: `%${search}%`,
                  },
                },
                {
                  fundingType: {
                    ilike: `%${search}%`,
                  },
                },
                {
                  countries: {
                    countryCode: {
                      ilike: `%${search}%`,
                    },
                  },
                },
              ],
            });
          }

          if (country) {
            conditions.push({
              countries: {
                countryCode: country,
              },
            });
          }

          if (degree) {
            conditions.push({
              degrees: {
                degreeId: degree,
              },
            });
          }

          if (field) {
            conditions.push({
              fields: {
                fieldId: field,
              },
            });
          }

          return conditions.length > 0 ? { AND: conditions } : undefined;
        })(),
        with: {
          countries: {
            with: {
              country: true,
            },
          },
          degrees: {
            with: {
              degree: true,
            },
          },
          fields: {
            with: {
              field: true,
            },
          },
          rounds: {
            where: { isActive: true },
            orderBy: (r: any, { asc }: any) => [asc(r.deadlineDate)],
            limit: 1,
          },
        },
        limit: l,
        offset: offset,
        orderBy: (s: any, { desc }: any) => [desc(s.createdAt)],
      });

      // Count total (filtered) - use the built conditions for core query
      const coreConditions = [];
      if (search) coreConditions.push(ilike(scholarships.name, `%${search}%`));
      if (country) {
        coreConditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToCountries.scholarshipId })
              .from(scholarshipsToCountries)
              .where(eq(scholarshipsToCountries.countryCode, country)),
          ),
        );
      }
      if (degree) {
        coreConditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToDegrees.scholarshipId })
              .from(scholarshipsToDegrees)
              .where(eq(scholarshipsToDegrees.degreeId, degree)),
          ),
        );
      }
      if (field) {
        coreConditions.push(
          inArray(
            scholarships.id,
            db
              .select({ id: scholarshipsToFields.scholarshipId })
              .from(scholarshipsToFields)
              .where(eq(scholarshipsToFields.fieldId, field)),
          ),
        );
      }

      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(scholarships)
        .where(coreConditions.length > 0 ? and(...coreConditions) : undefined);

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
        where: {
          date: {
            gte: new Date(start),
            lte: new Date(end),
          },
          round: {
            isActive: true,
          },
        },
        orderBy: (re: any, { asc }: any) => [asc(re.date)],
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
        where: { slug },
        with: {
          countries: { with: { country: true } },
          degrees: { with: { degree: true } },
          fields: { with: { field: true } },
          rounds: {
            with: {
              events: {
                orderBy: (e: any, { asc }: any) => [asc(e.date)],
              },
            },
            orderBy: (r: any, { desc }: any) => [desc(r.openDate)],
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
  )
  // --- Admin Taxonomy Management ---
  .group("/admin", (app) =>
    app
      .use(authorizationPlugin)
      // Countries
      .post(
        "/countries",
        async ({ body, user }) => {
          const id = body.code.toUpperCase();
          await db.insert(countries).values({
            ...body,
            code: id,
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { code: id } };
        },
        {
          role: "admin",
          body: t.Object({
            code: t.String(),
            name: t.String(),
            region: t.Optional(t.String()),
          }),
        },
      )
      .patch(
        "/countries/:code",
        async ({ params: { code }, body, user }) => {
          await db
            .update(countries)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(countries.code, code.toUpperCase()));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            region: t.Optional(t.String()),
          }),
        },
      )
      // Degree Levels
      .post(
        "/degrees",
        async ({ body, user }) => {
          const id = nanoid();
          await db.insert(degreeLevels).values({
            ...body,
            id,
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            rank: t.Optional(t.String()),
          }),
        },
      )
      .patch(
        "/degrees/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(degreeLevels)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(degreeLevels.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            rank: t.Optional(t.String()),
          }),
        },
      )
      // Fields of Study
      .post(
        "/fields",
        async ({ body, user }) => {
          const id = nanoid();
          await db.insert(fieldsOfStudy).values({
            ...body,
            id,
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
          }),
        },
      )
      .patch(
        "/fields/:id",
        async ({ params: { id }, body, user }) => {
          await db
            .update(fieldsOfStudy)
            .set({ ...body, updatedById: user.id, updatedAt: new Date() })
            .where(eq(fieldsOfStudy.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
          }),
        },
      )
      // --- Admin Scholarship Management ---
      .post(
        "/",
        async ({ body, user }) => {
          const id = nanoid();
          const { countryCodes, degreeIds, fieldIds, ...rest } = body;

          await db.transaction(async (tx) => {
            await tx.insert(scholarships).values({
              ...rest,
              id,
              createdById: user.id,
              updatedById: user.id,
            });

            if (countryCodes?.length) {
              await tx.insert(scholarshipsToCountries).values(
                countryCodes.map((code) => ({
                  scholarshipId: id,
                  countryCode: code,
                })),
              );
            }
            if (degreeIds?.length) {
              await tx.insert(scholarshipsToDegrees).values(
                degreeIds.map((degreeId) => ({
                  scholarshipId: id,
                  degreeId,
                })),
              );
            }
            if (fieldIds?.length) {
              await tx.insert(scholarshipsToFields).values(
                fieldIds.map((fieldId) => ({
                  scholarshipId: id,
                  fieldId,
                })),
              );
            }
          });

          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            slug: t.String(),
            description: t.Optional(t.String()),
            providerName: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            fundingType: t.Optional(
              t.Enum({
                fully_funded: "fully_funded",
                partial: "partial",
                tuition_only: "tuition_only",
              }),
            ),
            isActive: t.Optional(t.Boolean()),
            status: t.Optional(
              t.Enum({
                active: "active",
                inactive: "inactive",
                archived: "archived",
              }),
            ),
            countryCodes: t.Optional(t.Array(t.String())),
            degreeIds: t.Optional(t.Array(t.String())),
            fieldIds: t.Optional(t.Array(t.String())),
          }),
        },
      )
      .patch(
        "/:id",
        async ({ params: { id }, body, user }) => {
          const { countryCodes, degreeIds, fieldIds, ...rest } = body;

          await db.transaction(async (tx) => {
            if (Object.keys(rest).length > 0) {
              await tx
                .update(scholarships)
                .set({ ...rest, updatedById: user.id, updatedAt: new Date() })
                .where(eq(scholarships.id, id));
            }

            if (countryCodes !== undefined) {
              await tx
                .delete(scholarshipsToCountries)
                .where(eq(scholarshipsToCountries.scholarshipId, id));
              if (countryCodes.length > 0) {
                await tx.insert(scholarshipsToCountries).values(
                  countryCodes.map((code) => ({
                    scholarshipId: id,
                    countryCode: code,
                  })),
                );
              }
            }

            if (degreeIds !== undefined) {
              await tx
                .delete(scholarshipsToDegrees)
                .where(eq(scholarshipsToDegrees.scholarshipId, id));
              if (degreeIds.length > 0) {
                await tx.insert(scholarshipsToDegrees).values(
                  degreeIds.map((degreeId) => ({
                    scholarshipId: id,
                    degreeId,
                  })),
                );
              }
            }

            if (fieldIds !== undefined) {
              await tx
                .delete(scholarshipsToFields)
                .where(eq(scholarshipsToFields.scholarshipId, id));
              if (fieldIds.length > 0) {
                await tx.insert(scholarshipsToFields).values(
                  fieldIds.map((fieldId) => ({
                    scholarshipId: id,
                    fieldId,
                  })),
                );
              }
            }
          });

          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            slug: t.Optional(t.String()),
            description: t.Optional(t.String()),
            providerName: t.Optional(t.String()),
            websiteUrl: t.Optional(t.String()),
            fundingType: t.Optional(
              t.Enum({
                fully_funded: "fully_funded",
                partial: "partial",
                tuition_only: "tuition_only",
              }),
            ),
            isActive: t.Optional(t.Boolean()),
            status: t.Optional(
              t.Enum({
                active: "active",
                inactive: "inactive",
                archived: "archived",
              }),
            ),
            countryCodes: t.Optional(t.Array(t.String())),
            degreeIds: t.Optional(t.Array(t.String())),
            fieldIds: t.Optional(t.Array(t.String())),
          }),
        },
      )
      // Scholarship Rounds
      .post(
        "/rounds",
        async ({ body, user }) => {
          const id = nanoid();
          const { openDate, deadlineDate, ...rest } = body;
          await db.insert(scholarshipRounds).values({
            ...rest,
            id,
            openDate: openDate ? new Date(openDate) : undefined,
            deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            scholarshipId: t.String(),
            roundName: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
            openDate: t.Optional(t.String()), // ISO String, will be converted by Drizzle if configured or manually
            deadlineDate: t.Optional(t.String()),
            scholarshipAmount: t.Optional(t.String()),
            description: t.Optional(t.String()),
          }),
        },
      )
      .patch(
        "/rounds/:id",
        async ({ params: { id }, body, user }) => {
          const { openDate, deadlineDate, ...rest } = body;
          await db
            .update(scholarshipRounds)
            .set({
              ...rest,
              openDate: openDate ? new Date(openDate) : undefined,
              deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
              updatedById: user.id,
              updatedAt: new Date(),
            })
            .where(eq(scholarshipRounds.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            roundName: t.Optional(t.String()),
            isActive: t.Optional(t.Boolean()),
            openDate: t.Optional(t.String()),
            deadlineDate: t.Optional(t.String()),
            scholarshipAmount: t.Optional(t.String()),
            description: t.Optional(t.String()),
          }),
        },
      )
      // Round Events
      .post(
        "/rounds/:id/events",
        async ({ params: { id: roundId }, body, user }) => {
          const id = nanoid();
          await db.insert(roundEvents).values({
            ...body,
            id,
            roundId,
            date: new Date(body.date),
            createdById: user.id,
            updatedById: user.id,
          });
          return { success: true, data: { id } };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.String(),
            date: t.String(),
            type: t.Optional(
              t.Enum({
                webinar: "webinar",
                interview: "interview",
                result_announcement: "result_announcement",
                deadline: "deadline",
              }),
            ),
            description: t.Optional(t.String()),
          }),
        },
      )
      .patch(
        "/rounds/events/:id",
        async ({ params: { id }, body, user }) => {
          const { date, ...rest } = body;
          await db
            .update(roundEvents)
            .set({
              ...rest,
              date: date ? new Date(date) : undefined,
              updatedById: user.id,
              updatedAt: new Date(),
            })
            .where(eq(roundEvents.id, id));
          return { success: true };
        },
        {
          role: "admin",
          body: t.Object({
            name: t.Optional(t.String()),
            date: t.Optional(t.String()),
            type: t.Optional(
              t.Enum({
                webinar: "webinar",
                interview: "interview",
                result_announcement: "result_announcement",
                deadline: "deadline",
              }),
            ),
            description: t.Optional(t.String()),
          }),
        },
      ),
  );
