import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `pg-drizzle_${name}`);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userProfile = pgTable("user_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio"),
  location: text("location"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// --- Resource Library Tables ---

export const resourceCategories = pgTable("resource_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const resourceContentTypes = pgTable("resource_content_type", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Tool', 'Ebook', 'Guide'
  description: text("description"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const resources = pgTable("resource", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  s3Url: text("s3_url").notNull(),
  contentTypeId: text("content_type_id")
    .notNull()
    .references(() => resourceContentTypes.id),
  uploaderId: text("uploader_id")
    .notNull()
    .references(() => user.id),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const resourcesToCategories = pgTable(
  "resource_to_category",
  {
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => resourceCategories.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.resourceId, t.categoryId],
    },
  ],
);

// --- Resource Library Relations ---

export const resourceAttachments = pgTable("resource_attachment", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id")
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["file", "url"] }).notNull(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  fileFormat: text("file_format"), // NULL for URLs
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// --- Reusable Taxonomy Tables ---

export const countries = pgTable("country", {
  code: text("code").primaryKey(), // ISO code, e.g., 'NP', 'US'
  name: text("name").notNull(),
  region: text("region"), // e.g., 'Asia', 'Europe'
});

export const degreeLevels = pgTable("degree_level", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Bachelors', 'Masters', 'PhD'
  rank: text("rank"), // Optional helper for sorting degrees
});

export const fieldsOfStudy = pgTable("field_of_study", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Computer Science'
});

// --- Scholarship Core Tables ---

export const scholarships = pgTable("scholarship", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"), // Markdown supported
  providerName: text("provider_name"), // e.g. 'DAAD', 'Bill Gates Foundation'
  websiteUrl: text("website_url"),
  fundingType: text("funding_type", {
    enum: ["fully_funded", "partial", "tuition_only"],
  }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const scholarshipRounds = pgTable("scholarship_round", {
  id: text("id").primaryKey(),
  scholarshipId: text("scholarship_id")
    .notNull()
    .references(() => scholarships.id, { onDelete: "cascade" }),
  roundName: text("round_name"), // e.g., 'Fall 2025 Intake'
  isActive: boolean("is_active").default(false).notNull(),
  openDate: timestamp("open_date"),
  deadlineDate: timestamp("deadline_date"),
  scholarshipAmount: text("scholarship_amount"), // e.g. '$10,000 / year'
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

// --- Scholarship Junction Tables ---

export const scholarshipsToCountries = pgTable(
  "scholarship_to_country",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    countryCode: text("country_code")
      .notNull()
      .references(() => countries.code, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.countryCode],
    },
  ],
);

export const scholarshipsToFields = pgTable(
  "scholarship_to_field",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => fieldsOfStudy.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.fieldId],
    },
  ],
);

export const scholarshipsToDegrees = pgTable(
  "scholarship_to_degree",
  {
    scholarshipId: text("scholarship_id")
      .notNull()
      .references(() => scholarships.id, { onDelete: "cascade" }),
    degreeId: text("degree_id")
      .notNull()
      .references(() => degreeLevels.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      pk: [t.scholarshipId, t.degreeId],
    },
  ],
);

// --- Events & User Data ---

export const roundEvents = pgTable("round_event", {
  id: text("id").primaryKey(),
  roundId: text("round_id")
    .notNull()
    .references(() => scholarshipRounds.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., 'Interview Stage'
  date: timestamp("date").notNull(),
  type: text("type", {
    enum: ["webinar", "interview", "result_announcement", "deadline"],
  }),
  description: text("description"),
});

export const userApplications = pgTable("user_application", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  roundId: text("round_id")
    .notNull()
    .references(() => scholarshipRounds.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["saved", "preparing", "submitted", "rejected", "accepted"],
  }).default("saved"),
  personalNotes: text("personal_notes"),
  deadlineReminder: timestamp("deadline_reminder"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});
