import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  unique,
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
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: d.timestamp({ withTimezone: true }).$defaultFn(() => new Date()),
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
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// --- Resource Library Tables ---

export const resourceCategories = pgTable("resource_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const resourceContentTypes = pgTable("resource_content_type", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Tool', 'Ebook', 'Guide'
  description: text("description"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const resources = pgTable("resource", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  s3Url: text("s3_url").notNull(),
  contentTypeId: text("content_type_id").references(
    () => resourceContentTypes.id,
    { onDelete: "set null" },
  ),
  uploaderId: text("uploader_id").references(() => user.id, {
    onDelete: "set null",
  }),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
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
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// --- Reusable Taxonomy Tables ---

export const countries = pgTable("country", {
  code: text("code").primaryKey(), // ISO code, e.g., 'NP', 'US'
  name: text("name").notNull(),
  region: text("region"), // e.g., 'Asia', 'Europe'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const degreeLevels = pgTable("degree_level", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Bachelors', 'Masters', 'PhD'
  rank: text("rank"), // Optional helper for sorting degrees
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const fieldsOfStudy = pgTable("field_of_study", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., 'Computer Science'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
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
  isActive: boolean("is_active").default(true).notNull(),
  status: text("status", {
    enum: ["active", "inactive", "archived"],
  }).default("active"),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const scholarshipRounds = pgTable("scholarship_round", {
  id: text("id").primaryKey(),
  scholarshipId: text("scholarship_id")
    .notNull()
    .references(() => scholarships.id, { onDelete: "cascade" }),
  roundName: text("round_name"), // e.g., 'Fall 2025 Intake'
  description: text("description"), // Markdown supported
  isActive: boolean("is_active").default(false).notNull(),
  openDate: timestamp("open_date"),
  deadlineDate: timestamp("deadline_date"),
  scholarshipAmount: text("scholarship_amount"), // e.g. '$10,000 / year'
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
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
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
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
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// --- University Yelper Rating System ---

export const universities = pgTable("university", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  establishedYear: text("established_year"),
  location: text("location"),
  country: text("country"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const colleges = pgTable("college", {
  id: text("id").primaryKey(),
  universityId: text("university_id")
    .notNull()
    .references(() => universities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type"), // e.g., 'Consituent', 'Affiliated'
  description: text("description"),
  websiteUrl: text("website_url"),
  location: text("location"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const departments = pgTable("department", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  websiteUrl: text("website_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const collegeDepartments = pgTable(
  "college_department",
  {
    id: text("id").primaryKey(),
    collegeId: text("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    description: text("description"), // Custom description for the college department
    websiteUrl: text("website_url"), // Custom website URL for the college department
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  },
  (t) => ({
    uniqueCollegeDepartment: unique().on(t.collegeId, t.departmentId),
  }),
);

export const academicPrograms = pgTable("academic_program", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  credits: text("credits"),
  degreeLevels: text("degree_levels", {
    enum: [
      "certificate",
      "diploma",
      "associate",
      "undergraduate",
      "postgraduate",
      "doctoral",
      "postdoctoral",
    ],
  }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const academicCourses = pgTable("academic_course", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  credits: text("credits"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const collegeDepartmentsToPrograms = pgTable(
  "collegedepartment_to_program",
  {
    id: text("id").primaryKey(),
    code: text("code"), // Custom code for the program in the college department
    description: text("description"), // Custom description for the program in the college department
    credits: text("credits"), // Custom credits for the program in the college department
    isActive: boolean("is_active").default(true).notNull(),
    collegeDepartmentId: text("college_department_id")
      .notNull()
      .references(() => collegeDepartments.id, { onDelete: "cascade" }),
    programId: text("program_id")
      .notNull()
      .references(() => academicPrograms.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      uniqueCollegeDepartmentProgram: unique().on(
        t.collegeDepartmentId,
        t.programId,
      ),
    },
  ],
);

export const collegeDepartmentProgramToCourses = pgTable(
  "collegeprogram_to_course",
  {
    id: text("id").primaryKey(),
    code: text("code"), // Custom code for the course in the college program
    description: text("description"), // Custom description for the course in the college program
    credits: text("credits"), // Custom credits for the course in the college program
    isActive: boolean("is_active").default(true).notNull(),
    programId: text("college_program_id")
      .notNull()
      .references(() => collegeDepartmentsToPrograms.id, {
        onDelete: "cascade",
      }),
    courseId: text("course_id")
      .notNull()
      .references(() => academicCourses.id, { onDelete: "cascade" }),
  },
  (t) => [
    {
      uniqueProgramCourse: unique().on(t.programId, t.courseId),
    },
  ],
);

export const ratingCategories = pgTable("rating_category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  sortOrder: text("sort_order"),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export const ratings = pgTable(
  "rating",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: text("rating").notNull(),
    review: text("review"),
    ratingCategoryId: text("rating_category_id")
      .notNull()
      .references(() => ratingCategories.id, { onDelete: "set null" }),
    isVerified: boolean("is_verified").default(false).notNull(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  },
  (t) => [index("idx_rating_category_id").on(t.ratingCategoryId)],
);

export const universityToRatings = pgTable(
  "university_to_rating",
  {
    universityId: text("university_id")
      .notNull()
      .references(() => universities.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_university_rating_university_id").on(t.universityId),
    index("idx_university_rating_rating_id").on(t.ratingId),
  ],
);

export const collegeToRatings = pgTable(
  "college_to_rating",
  {
    collegeId: text("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_college_rating_college_id").on(t.collegeId),
    index("idx_college_rating_rating_id").on(t.ratingId),
  ],
);

export const departmentToRatings = pgTable(
  "department_to_rating",
  {
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_department_rating_department_id").on(t.departmentId),
    index("idx_department_rating_rating_id").on(t.ratingId),
  ],
);

export const collegeDepartmentsToRatings = pgTable(
  "collegedepartment_to_rating",
  {
    collegeDepartmentId: text("college_department_id")
      .notNull()
      .references(() => collegeDepartments.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_collegedept_rating_college_department_id").on(
      t.collegeDepartmentId,
    ),
    index("idx_collegedept_rating_rating_id").on(t.ratingId),
  ],
);

export const programToRatings = pgTable(
  "program_to_rating",
  {
    programId: text("program_id")
      .notNull()
      .references(() => academicPrograms.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_program_rating_program_id").on(t.programId),
    index("idx_program_rating_rating_id").on(t.ratingId),
  ],
);

export const collegeDepartmentProgramsToRatings = pgTable(
  "collegedepartmentprogram_to_rating",
  {
    collegeDepartmentProgramId: text("college_department_program_id")
      .notNull()
      .references(() => collegeDepartmentsToPrograms.id, {
        onDelete: "cascade",
      }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_collegedeptprog_rating_college_department_program_id").on(
      t.collegeDepartmentProgramId,
    ),
    index("idx_collegedeptprog_rating_rating_id").on(t.ratingId),
  ],
);

export const courseToRatings = pgTable(
  "course_to_rating",
  {
    courseId: text("course_id")
      .notNull()
      .references(() => academicCourses.id, { onDelete: "cascade" }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("idx_course_rating_course_id").on(t.courseId),
    index("idx_course_rating_rating_id").on(t.ratingId),
  ],
);

export const collegeDepartmentProgramCourseToRatings = pgTable(
  "collegedepartmentprogramcourse_to_rating",
  {
    collegeDepartmentProgramToCourseId: text(
      "college_department_program_course_id",
    )
      .notNull()
      .references(() => collegeDepartmentProgramToCourses.id, {
        onDelete: "cascade",
      }),
    ratingId: text("rating_id")
      .notNull()
      .references(() => ratings.id, { onDelete: "cascade" }),
  },
  (t) => [
    index(
      "idx_collegedeptprogcpc_rating_college_department_program_course_id",
    ).on(t.collegeDepartmentProgramToCourseId),
    index("idx_collegedeptprogcpc_rating_rating_id").on(t.ratingId),
  ],
);
