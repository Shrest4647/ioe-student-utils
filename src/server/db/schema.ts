import {
  boolean,
  index,
  jsonb,
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

// --- Resume Builder Tables ---

export const resumeProfiles = pgTable("resume_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: jsonb("address"), // JSONB for street, city, state, postalCode, country
  nationality: text("nationality"),
  dateOfBirth: text("date_of_birth"), // Year-month format
  photoUrl: text("photo_url"), // S3 URL
  summary: text("summary"), // Professional summary/bio
  linkedIn: text("linked_in"), // LinkedIn URL
  github: text("github"), // GitHub URL
  web: text("web"), // Personal website URL
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export const workExperiences = pgTable("work_experience", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  employer: text("employer"),
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format or null for current
  city: text("city"),
  country: text("country"),
  description: text("description"), // Job description and achievements
  referenceLink: text("reference_link"), // Link to experience letter/certificate
});

export const educationRecords = pgTable("education_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  institution: text("institution"),
  qualification: text("qualification"), // e.g., "Bachelor of Science in Computer Science"
  degreeLevel: text("degree_level"), // e.g., Diploma, Bachelor, Master, PhD, Certificate
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format
  graduationDate: text("graduation_date"), // Year-month format
  grade: text("grade"), // The grade/score obtained
  gradeType: text("grade_type"), // GPA-4, GPA-5, GPA-10, Percentage, etc.
  description: text("description"), // Additional details
  city: text("city"),
  country: text("country"),
  referenceLink: text("reference_link"), // Link to transcript, degree certificate
});

export const projectRecords = pgTable("project_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"),
  description: text("description"),
  startDate: text("start_date"), // Year-month format
  endDate: text("end_date"), // Year-month format or null for ongoing
  role: text("role"), // Role in the project
  referenceLink: text("reference_link"), // Link to project page, GitHub, etc.
});

export const userSkills = pgTable("user_skill", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // programming-language, communication, technical, organizational, databases, scores, interests, etc.
  skills: jsonb("skills").notNull(), // JSONB array of skill objects
});

export const languageSkills = pgTable("language_skill", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  language: text("language").notNull(),
  listening: text("listening"), // CEFR levels: A1, A2, B1, B2, C1, C2
  reading: text("reading"), // CEFR levels
  speaking: text("speaking"), // CEFR levels
  writing: text("writing"), // CEFR levels
  referenceLink: text("reference_link"), // Link to language certificate
});

export const positionsOfResponsibilityRecords = pgTable(
  "position_of_responsibility_record",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => resumeProfiles.id, { onDelete: "cascade" }),
    name: text("name"), // Position/role title
    description: text("description"),
    startDate: text("start_date"), // Year-month format
    endDate: text("end_date"), // Year-month format or null for current
    referenceLink: text("reference_link"), // Link to volunteering certificate
  },
);

export const certificationsRecords = pgTable("certification_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"), // Certificate/certification name
  issuer: text("issuer"), // Issuing organization
  issueDate: text("issue_date"), // Year-month format
  credentialUrl: text("credential_url"), // Link to credential/certificate
});

export const referencesRecords = pgTable("reference_record", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name"), // Reference's name
  title: text("title"), // Reference's job title
  relation: text("relation"), // How they know the applicant
  institution: text("institution"), // If academic reference
  email: text("email"),
  phone: text("phone"),
});

export const resumes = pgTable("resume", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => resumeProfiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Resume name (e.g., "Software Developer Resume")
  includedSections: jsonb("included_sections").notNull(), // JSONB array of sections with order
  designTheme: jsonb("design_theme"), // JSONB metadata for themed rendering
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

// --- Recommendation Letter Generator Tables ---

export const recommendationTemplate = pgTable(
  "recommendation_template",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category", {
      enum: ["research", "academic", "industry", "general", "country_specific"],
    }).notNull(),
    content: text("content").notNull(), // Template with placeholders like {{student_name}}
    variables: jsonb("variables")
      .$type<
        Array<{
          name: string;
          label: string;
          type: "text" | "textarea" | "date" | "select" | "multiselect";
          required: boolean;
          defaultValue?: string;
          description?: string;
          options?: string[];
        }>
      >()
      .notNull(),
    targetProgramType: text("target_program_type", {
      enum: ["phd", "masters", "job", "funding", "any"],
    }).notNull(),
    targetRegion: text("target_region", {
      enum: ["us", "uk", "eu", "asia", "global"],
    }),
    isSystemTemplate: boolean("is_system_template").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("idx_recommendation_template_category").on(t.category),
    index("idx_recommendation_template_program_type").on(t.targetProgramType),
    index("idx_recommendation_template_region").on(t.targetRegion),
    index("idx_recommendation_template_active").on(t.isActive),
    index("idx_recommendation_template_composite").on(
      t.category,
      t.targetProgramType,
      t.targetRegion,
    ),
  ],
);

export const recommendationLetter = pgTable(
  "recommendation_letter",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    templateId: text("template_id")
      .notNull()
      .references(() => recommendationTemplate.id, { onDelete: "restrict" }),

    // Recommender Information
    recommenderName: text("recommender_name").notNull(),
    recommenderTitle: text("recommender_title").notNull(),
    recommenderInstitution: text("recommender_institution").notNull(),
    recommenderEmail: text("recommender_email"),
    recommenderDepartment: text("recommender_department"),

    // Target Information
    targetInstitution: text("target_institution").notNull(),
    targetProgram: text("target_program").notNull(),
    targetDepartment: text("target_department"),
    targetCountry: text("target_country").notNull(),
    purpose: text("purpose").notNull(), // admission, scholarship, job, etc.

    // Relationship & Context
    relationship: text("relationship").notNull(),
    contextOfMeeting: text("context_of_meeting"), // courses, research, etc.

    // Student Information
    studentAchievements: text("student_achievements"),
    researchExperience: text("research_experience"),
    academicPerformance: text("academic_performance"),
    personalQualities: text("personal_qualities"),
    customContent: text("custom_content"),

    // Generated Content
    finalContent: text("final_content").notNull(), // The actual letter text
    pdfUrl: text("pdf_url"), // S3 URL
    googleDocUrl: text("google_doc_url"),

    status: text("status", {
      enum: ["draft", "completed", "exported"],
    })
      .default("draft")
      .notNull(),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [
    index("idx_recommendation_letter_student_id").on(t.studentId),
    index("idx_recommendation_letter_status").on(t.status),
    index("idx_recommendation_letter_created_at").on(t.createdAt),
    index("idx_recommendation_letter_template_id").on(t.templateId),
  ],
);

export const studentProfileData = pgTable(
  "student_profile_data",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),

    // Academic Information
    gpa: text("gpa"), // e.g., "3.8/4.0"
    major: text("major"),
    minor: text("minor"),
    expectedGraduation: text("expected_graduation"), // e.g., "May 2025"

    // Research & Skills
    researchInterests: text("research_interests"), // JSON array or comma-separated
    skills: text("skills"), // JSON array or comma-separated

    // Achievements & Experience
    achievements: text("achievements"), // Awards, honors, etc.
    projects: text("projects"), // Research or academic projects
    workExperience: text("work_experience"),
    extracurricular: text("extracurricular"),

    // Goals
    careerGoals: text("career_goals"),

    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (t) => [index("idx_student_profile_data_user_id").on(t.userId)],
);

// --- GPA Converter Tables ---

export const gpaConversionStandards = pgTable(
  "gpa_conversion_standard",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(), // e.g., "WES", "Scholaro"
    description: text("description"), // Description of the conversion standard
    isActive: boolean("is_active").default(true).notNull(),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => [
    index("gpa_standard_name_idx").on(t.name),
    index("gpa_standard_is_active_idx").on(t.isActive),
  ],
);

export const gpaConversionRanges = pgTable(
  "gpa_conversion_range",
  {
    id: text("id").primaryKey(),
    standardId: text("standard_id")
      .notNull()
      .references(() => gpaConversionStandards.id, { onDelete: "cascade" }),
    minPercentage: text("min_percentage").notNull(), // Stored as string for precision
    maxPercentage: text("max_percentage").notNull(), // Stored as string for precision
    gpaValue: text("gpa_value").notNull(), // e.g., "4.0", "3.7"
    gradeLabel: text("grade_label"), // e.g., "A", "B+"
    sortOrder: text("sort_order").notNull(), // For proper ordering of ranges
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => [
    index("gpa_range_standard_id_idx").on(t.standardId),
    index("gpa_range_sort_order_idx").on(t.sortOrder),
  ],
);

export const gpaConversions = pgTable("gpa_conversion", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  standardId: text("standard_id")
    .notNull()
    .references(() => gpaConversionStandards.id, { onDelete: "cascade" }),
  name: text("name"), // User-given name e.g., "Semester 1"
  cumulativeGPA: text("cumulative_gpa").notNull(), // Stored as string for precision
  totalCredits: text("total_credits").notNull(),
  totalQualityPoints: text("total_quality_points").notNull(),
  courseCount: text("course_count").notNull(), // Number of courses in calculation
  calculationData: jsonb("calculation_data").notNull(), // Array of course objects
  isDeleted: boolean("is_deleted").default(false).notNull(), // Soft delete
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});
