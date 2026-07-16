import {
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { user } from "../schema";

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

export type University = typeof universities.$inferSelect;
export type NewUniversity = typeof universities.$inferInsert;

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

export type College = typeof colleges.$inferSelect;
export type NewCollege = typeof colleges.$inferInsert;

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
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

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

export type CollegeDepartment = typeof collegeDepartments.$inferSelect;
export type NewCollegeDepartment = typeof collegeDepartments.$inferInsert;

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

export type AcademicProgram = typeof academicPrograms.$inferSelect;
export type NewAcademicProgram = typeof academicPrograms.$inferInsert;

export const academicCourses = pgTable("academic_course", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  code: text("code").notNull().unique(),
  description: text("description"),
  credits: text("credits"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

export type AcademicCourse = typeof academicCourses.$inferSelect;
export type NewAcademicCourse = typeof academicCourses.$inferInsert;

export const academicCourseSlugAliases = pgTable(
  "academic_course_slug_alias",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => academicCourses.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  },
  (t) => [index("idx_course_slug_alias_course_id").on(t.courseId)],
);

export type AcademicCourseSlugAlias =
  typeof academicCourseSlugAliases.$inferSelect;
export type NewAcademicCourseSlugAlias =
  typeof academicCourseSlugAliases.$inferInsert;

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

export type CollegeDepartmentProgram =
  typeof collegeDepartmentsToPrograms.$inferSelect;
export type NewCollegeDepartmentProgram =
  typeof collegeDepartmentsToPrograms.$inferInsert;

export const collegeDepartmentProgramToCourses = pgTable(
  "collegeprogram_to_course",
  {
    id: text("id").primaryKey(),
    code: text("code"), // Custom code for the course in the college program
    description: text("description"), // Custom description for the course in the college program
    credits: text("credits"), // Custom credits for the course in the college program
    yearNumber: smallint("year_number"),
    partNumber: smallint("part_number"),
    courseType: text("course_type", { enum: ["core", "elective"] }),
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

export type CollegeDepartmentProgramCourse =
  typeof collegeDepartmentProgramToCourses.$inferSelect;
export type NewCollegeDepartmentProgramCourse =
  typeof collegeDepartmentProgramToCourses.$inferInsert;

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

export type RatingCategory = typeof ratingCategories.$inferSelect;
export type NewRatingCategory = typeof ratingCategories.$inferInsert;

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

export type Rating = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;

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
