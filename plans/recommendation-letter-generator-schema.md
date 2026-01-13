# Recommendation Letter Generator - Database Schema Specification

## Overview
This document provides the complete database schema for the Recommendation Letter Generator feature, including all tables, indexes, relationships, and seed data for templates.

---

## New Tables

### 1. recommendation_template

Stores reusable letter templates with variable placeholders.

```typescript
// Add to src/server/db/schema.ts

export const recommendationTemplate = pgTable("recommendation_template", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", {
    enum: ["research", "academic", "industry", "general", "country_specific"],
  }).notNull(),
  content: text("content").notNull(), // Template with placeholders like {{student_name}}
  variables: jsonb("variables").$type<{
    name: string;
    label: string;
    type: "text" | "textarea" | "date" | "select" | "multiselect";
    required: boolean;
    defaultValue?: string;
    description?: string;
    options?: string[]; // For select/multiselect types
  }[]>().notNull(),
  targetProgramType: text("target_program_type", {
    enum: ["phd", "masters", "job", "funding", "any"],
  }).notNull(),
  targetRegion: text("target_region", {
    enum: ["us", "uk", "eu", "asia", "global", null],
  }),
  isSystemTemplate: boolean("is_system_template").default(true).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: text("created_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedById: text("updated_by_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Indexes for template queries
// Index on category for filtering
// Index on targetProgramType for filtering
// Index on targetRegion for filtering
// Index on isActive for filtering active templates
// Composite index on (category, targetProgramType, targetRegion) for complex filtering
```

### 2. recommendation_letter

Stores generated letters and their metadata.

```typescript
// Add to src/server/db/schema.ts

export const recommendationLetter = pgTable("recommendation_letter", {
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
  }).default("draft").notNull(),

  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Indexes for letter queries
// Index on studentId for user's letters
// Index on status for filtering
// Index on createdAt for sorting
// Index on templateId for template usage analytics
```

### 3. student_profile_data

Extended profile data for smart pre-filling in recommendation letters.

```typescript
// Add to src/server/db/schema.ts

export const studentProfileData = pgTable("student_profile_data", {
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

  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Indexes
// Index on userId for quick profile lookup
```

---

## Indexes

Add these indexes to optimize query performance:

```typescript
// Template indexes
CREATE INDEX idx_recommendation_template_category ON recommendation_template(category);
CREATE INDEX idx_recommendation_template_program_type ON recommendation_template(target_program_type);
CREATE INDEX idx_recommendation_template_region ON recommendation_template(target_region);
CREATE INDEX idx_recommendation_template_active ON recommendation_template(is_active);
CREATE INDEX idx_recommendation_template_composite ON recommendation_template(category, target_program_type, target_region) WHERE is_active = true;

// Letter indexes
CREATE INDEX idx_recommendation_letter_student_id ON recommendation_letter(student_id);
CREATE INDEX idx_recommendation_letter_status ON recommendation_letter(status);
CREATE INDEX idx_recommendation_letter_created_at ON recommendation_letter(created_at DESC);
CREATE INDEX idx_recommendation_letter_template_id ON recommendation_letter(template_id);

// Profile index
CREATE INDEX idx_student_profile_data_user_id ON student_profile_data(user_id);
```

---

## Migration File

Create a new migration file: `src/server/db/migrations/YYYY-MM-DD-recommendation-letters.sql`

```sql
-- Create recommendation_template table
CREATE TABLE IF NOT EXISTS recommendation_template (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('research', 'academic', 'industry', 'general', 'country_specific')),
  content TEXT NOT NULL,
  variables JSONB NOT NULL,
  target_program_type TEXT NOT NULL CHECK (target_program_type IN ('phd', 'masters', 'job', 'funding', 'any')),
  target_region TEXT CHECK (target_region IN ('us', 'uk', 'eu', 'asia', 'global')),
  is_system_template BOOLEAN DEFAULT TRUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  updated_by_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create recommendation_letter table
CREATE TABLE IF NOT EXISTS recommendation_letter (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES recommendation_template(id) ON DELETE RESTRICT,

  -- Recommender Information
  recommender_name TEXT NOT NULL,
  recommender_title TEXT NOT NULL,
  recommender_institution TEXT NOT NULL,
  recommender_email TEXT,
  recommender_department TEXT,

  -- Target Information
  target_institution TEXT NOT NULL,
  target_program TEXT NOT NULL,
  target_department TEXT,
  target_country TEXT NOT NULL,
  purpose TEXT NOT NULL,

  -- Relationship & Context
  relationship TEXT NOT NULL,
  context_of_meeting TEXT,

  -- Student Information
  student_achievements TEXT,
  research_experience TEXT,
  academic_performance TEXT,
  personal_qualities TEXT,
  custom_content TEXT,

  -- Generated Content
  final_content TEXT NOT NULL,
  pdf_url TEXT,
  google_doc_url TEXT,

  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'completed', 'exported')),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create student_profile_data table
CREATE TABLE IF NOT EXISTS student_profile_data (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,

  -- Academic Information
  gpa TEXT,
  major TEXT,
  minor TEXT,
  expected_graduation TEXT,

  -- Research & Skills
  research_interests TEXT,
  skills TEXT,

  -- Achievements & Experience
  achievements TEXT,
  projects TEXT,
  work_experience TEXT,
  extracurricular TEXT,

  -- Goals
  career_goals TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_recommendation_template_category ON recommendation_template(category);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_program_type ON recommendation_template(target_program_type);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_region ON recommendation_template(target_region);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_active ON recommendation_template(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_composite ON recommendation_template(category, target_program_type, target_region) WHERE is_active = TRUE;

-- Create indexes for letters
CREATE INDEX IF NOT EXISTS idx_recommendation_letter_student_id ON recommendation_letter(student_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_letter_status ON recommendation_letter(status);
CREATE INDEX IF NOT EXISTS idx_recommendation_letter_created_at ON recommendation_letter(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_letter_template_id ON recommendation_letter(template_id);

-- Create index for profile
CREATE INDEX IF NOT EXISTS idx_student_profile_data_user_id ON student_profile_data(user_id);
```

---

## Seed Data for Templates

Insert 5-10 system templates:

```sql
-- Template 1: Research-Focused PhD
INSERT INTO recommendation_template (
  id,
  name,
  description,
  category,
  content,
  variables,
  target_program_type,
  target_region,
  is_system_template,
  is_active
) VALUES (
  'tpl_research_phd_strong',
  'PhD Research - Strong Candidate',
  'Ideal for strong PhD candidates with significant research experience',
  'research',
  '[Date]

Dear {{target_admissions_committee}},

It is my great pleasure to write this letter of recommendation for {{student_name}} for admission to the {{target_program}} at {{target_institution}}. I have known {{student_name}} for {{duration_known}} in my capacity as {{your_title}} at {{your_institution}}, and I can confidently state that {{student_pronoun}} is one of the most exceptional students I have had the privilege to mentor.

{{student_name}} worked under my supervision as {{relationship}}, during which {{student_pronoun}} demonstrated exceptional research aptitude and intellectual curiosity. {{student_pronoun}} contributed significantly to our research on {{research_topic}}, where {{student_pronoun}} {{research_contribution}}. This work resulted in {{research_outcome}}.

Academically, {{student_name}} has consistently performed at the top of {{student_pronoun}} class, maintaining a GPA of {{student_gpa}}. {{student_pronoun}} possesses a rare combination of theoretical understanding and practical skills that is essential for doctoral research. In my {{course_name}} course, {{student_name}} not only excelled in coursework but also demonstrated {{specific_strength}}.

Beyond {{student_pronoun}} technical abilities, {{student_name}} is a dedicated and collaborative researcher. {{student_pronoun}} has shown {{personal_quality_1}} and {{personal_quality_2}}, making {{student_object}} a valuable member of any research team. {{student_pronoun}} has also demonstrated {{leadership_example}}.

I am particularly impressed by {{student_name}}''s research potential, as evidenced by {{evidence_of_potential}}. {{student_pronoun}} research interests in {{research_interests}} align perfectly with the strengths of your program, and I am confident that {{student_pronoun}} will make significant contributions to the field.

I strongly recommend {{student_name}} for admission to your PhD program without reservation. I expect {{student_object}} to develop into an outstanding researcher and scholar. Please do not hesitate to contact me if you require any additional information.

Sincerely,

{{your_name}}
{{your_title}}
{{your_department}}
{{your_institution}}
{{your_email}}
',
  '[
    {"name": "target_admissions_committee", "label": "Admissions Committee", "type": "text", "required": true, "defaultValue": "Members of the Admissions Committee", "description": "Salutation for the letter"},
    {"name": "student_name", "label": "Student Name", "type": "text", "required": true, "defaultValue": "{{user.name}}", "description": "Full name of the student"},
    {"name": "target_program", "label": "Target Program", "type": "text", "required": true, "description": "Name of the PhD program"},
    {"name": "target_institution", "label": "Target Institution", "type": "text", "required": true, "description": "Name of the university"},
    {"name": "duration_known", "label": "Duration Known", "type": "text", "required": true, "description": "How long you have known the student (e.g., \"two years\")"},
    {"name": "your_title", "label": "Your Title", "type": "text", "required": true, "description": "Your position/title"},
    {"name": "your_institution", "label": "Your Institution", "type": "text", "required": true, "description": "Your institution name"},
    {"name": "student_pronoun", "label": "Student Pronoun", "type": "select", "required": true, "options": ["he", "she", "they"], "description": "Subject pronoun"},
    {"name": "student_object", "label": "Student Object Pronoun", "type": "select", "required": true, "options": ["him", "her", "them"], "description": "Object pronoun"},
    {"name": "relationship", "label": "Relationship", "type": "text", "required": true, "description": "Your relationship to the student"},
    {"name": "research_topic", "label": "Research Topic", "type": "textarea", "required": true, "description": "Topic of research the student worked on"},
    {"name": "research_contribution", "label": "Research Contribution", "type": "textarea", "required": true, "description": "What the student contributed to the research"},
    {"name": "research_outcome", "label": "Research Outcome", "type": "textarea", "required": true, "description": "Outcome of the research (publications, presentations, etc.)"},
    {"name": "student_gpa", "label": "Student GPA", "type": "text", "required": true, "description": "Student''s GPA"},
    {"name": "course_name", "label": "Course Name", "type": "text", "required": true, "description": "A specific course the student excelled in"},
    {"name": "specific_strength", "label": "Specific Strength", "type": "textarea", "required": true, "description": "Specific strength demonstrated in the course"},
    {"name": "personal_quality_1", "label": "Personal Quality 1", "type": "text", "required": true, "description": "First personal quality"},
    {"name": "personal_quality_2", "label": "Personal Quality 2", "type": "text", "required": true, "description": "Second personal quality"},
    {"name": "leadership_example", "label": "Leadership Example", "type": "textarea", "required": true, "description": "Example of leadership or initiative"},
    {"name": "evidence_of_potential", "label": "Evidence of Potential", "type": "textarea", "required": true, "description": "Evidence of student''s research potential"},
    {"name": "research_interests", "label": "Research Interests", "type": "textarea", "required": true, "description": "Student''s research interests"},
    {"name": "your_name", "label": "Your Name", "type": "text", "required": true, "description": "Recommender''s name"},
    {"name": "your_department", "label": "Your Department", "type": "text", "required": true, "description": "Recommender''s department"},
    {"name": "your_email", "label": "Your Email", "type": "text", "required": true, "description": "Recommender''s email"}
  ]'::jsonb,
  'phd',
  'global',
  true,
  true
);

-- Template 2: Master's Program - General
INSERT INTO recommendation_template (
  id,
  name,
  description,
  category,
  content,
  variables,
  target_program_type,
  target_region,
  is_system_template,
  is_active
) VALUES (
  'tpl_masters_general',
  'Master''s Program - General',
  'Balanced template for Master''s program applications',
  'academic',
  '[Date]

To the Graduate Admissions Committee,

I am writing to enthusiastically recommend {{student_name}} for admission to the {{target_program}} at {{target_institution}}. As {{your_title}} at {{your_institution}}, I have had the pleasure of knowing {{student_name}} for {{duration_known}} as {{relationship}}.

During this time, {{student_name}} has consistently demonstrated {{academic_strength}}. In my {{course_name}} course, {{student_pronoun}} earned a {{grade}} and distinguished {{student_object}}self through {{class_performance}}. {{student_pronoun}} possesses a strong foundation in {{subject_area}}, as evidenced by {{evidence_of_knowledge}}.

Beyond academic performance, {{student_name}} has shown {{personal_quality}}. {{anecdote}}. This demonstrates {{student_pronoun}} ability to {{skill_demonstrated}}.

{{student_name}} has expressed particular interest in {{student_interests}}, which aligns well with your program''s strengths. I am confident that {{student_pronoun}} will be an excellent addition to your cohort and will make meaningful contributions to your academic community.

I recommend {{student_name}} without reservation. Please feel free to contact me with any questions.

Sincerely,

{{your_name}}
{{your_title}}
{{your_department}}
{{your_institution}}
{{your_email}}
',
  '[
    {"name": "student_name", "label": "Student Name", "type": "text", "required": true, "defaultValue": "{{user.name}}"},
    {"name": "target_program", "label": "Target Program", "type": "text", "required": true},
    {"name": "target_institution", "label": "Target Institution", "type": "text", "required": true},
    {"name": "your_title", "label": "Your Title", "type": "text", "required": true},
    {"name": "your_institution", "label": "Your Institution", "type": "text", "required": true},
    {"name": "duration_known", "label": "Duration Known", "type": "text", "required": true},
    {"name": "relationship", "label": "Relationship", "type": "text", "required": true},
    {"name": "academic_strength", "label": "Academic Strength", "type": "textarea", "required": true},
    {"name": "course_name", "label": "Course Name", "type": "text", "required": true},
    {"name": "student_pronoun", "label": "Student Pronoun", "type": "select", "required": true, "options": ["he", "she", "they"]},
    {"name": "student_object", "label": "Student Object Pronoun", "type": "select", "required": true, "options": ["himself", "herself", "themself"]},
    {"name": "grade", "label": "Grade", "type": "text", "required": true},
    {"name": "class_performance", "label": "Class Performance", "type": "textarea", "required": true},
    {"name": "subject_area", "label": "Subject Area", "type": "text", "required": true},
    {"name": "evidence_of_knowledge", "label": "Evidence of Knowledge", "type": "textarea", "required": true},
    {"name": "personal_quality", "label": "Personal Quality", "type": "text", "required": true},
    {"name": "anecdote", "label": "Anecdote", "type": "textarea", "required": true},
    {"name": "skill_demonstrated", "label": "Skill Demonstrated", "type": "text", "required": true},
    {"name": "student_interests", "label": "Student Interests", "type": "textarea", "required": true},
    {"name": "your_name", "label": "Your Name", "type": "text", "required": true},
    {"name": "your_department", "label": "Your Department", "type": "text", "required": true},
    {"name": "your_email", "label": "Your Email", "type": "text", "required": true}
  ]'::jsonb,
  'masters',
  'global',
  true,
  true
);

-- Template 3: Industry Job - Software Engineering
INSERT INTO recommendation_template (
  id,
  name,
  description,
  category,
  content,
  variables,
  target_program_type,
  target_region,
  is_system_template,
  is_active
) VALUES (
  'tpl_industry_software',
  'Industry Position - Software Engineering',
  'For software engineering and technical positions',
  'industry',
  '[Date]

To the Hiring Manager,

I am writing to recommend {{student_name}} for the {{position}} role at {{company}}. As {{your_title}} at {{your_institution}}, I have worked closely with {{student_name}} for {{duration_known}} and can confidently speak to {{student_pronoun}} technical abilities and potential as a software engineer.

{{student_name}} has demonstrated exceptional programming skills through {{project_experience}}. In our {{project_name}} project, {{student_pronoun}} was responsible for {{responsibilities}}, where {{student_pronoun}} successfully {{achievement}}. {{student_pronoun}} code quality is {{code_quality_description}}, and {{student_pronoun}} consistently follows {{best_practices}}.

Technically, {{student_name}} is proficient in {{technical_skills}}. {{student_pronoun}} has experience with {{specific_technologies}}, which makes {{student_object}} well-suited for this role. What sets {{student_name}} apart is {{unique_strength}}.

In terms of soft skills, {{student_name}} is an excellent {{soft_skill_1}} and {{soft_skill_2}}. {{teamwork_example}}. {{student_pronoun}} communicates technical concepts clearly and works effectively in team environments.

I strongly believe {{student_name}} would be a valuable addition to your team. {{student_pronoun}} combination of technical skills, practical experience, and collaborative mindset makes {{student_object}} an ideal candidate for this position.

Please do not hesitate to contact me if you need any additional information.

Best regards,

{{your_name}}
{{your_title}}
{{your_department}}
{{your_institution}}
{{your_email}}
',
  '[
    {"name": "student_name", "label": "Student Name", "type": "text", "required": true, "defaultValue": "{{user.name}}"},
    {"name": "position", "label": "Position", "type": "text", "required": true},
    {"name": "company", "label": "Company", "type": "text", "required": true},
    {"name": "your_title", "label": "Your Title", "type": "text", "required": true},
    {"name": "your_institution", "label": "Your Institution", "type": "text", "required": true},
    {"name": "duration_known", "label": "Duration Known", "type": "text", "required": true},
    {"name": "student_pronoun", "label": "Student Pronoun", "type": "select", "required": true, "options": ["he", "she", "they"]},
    {"name": "student_object", "label": "Student Object Pronoun", "type": "select", "required": true, "options": ["him", "her", "them"]},
    {"name": "project_experience", "label": "Project Experience", "type": "textarea", "required": true},
    {"name": "project_name", "label": "Project Name", "type": "text", "required": true},
    {"name": "responsibilities", "label": "Responsibilities", "type": "textarea", "required": true},
    {"name": "achievement", "label": "Achievement", "type": "textarea", "required": true},
    {"name": "code_quality_description", "label": "Code Quality", "type": "text", "required": true},
    {"name": "best_practices", "label": "Best Practices", "type": "text", "required": true},
    {"name": "technical_skills", "label": "Technical Skills", "type": "textarea", "required": true},
    {"name": "specific_technologies", "label": "Specific Technologies", "type": "textarea", "required": true},
    {"name": "unique_strength", "label": "Unique Strength", "type": "textarea", "required": true},
    {"name": "soft_skill_1", "label": "Soft Skill 1", "type": "text", "required": true},
    {"name": "soft_skill_2", "label": "Soft Skill 2", "type": "text", "required": true},
    {"name": "teamwork_example", "label": "Teamwork Example", "type": "textarea", "required": true},
    {"name": "your_name", "label": "Your Name", "type": "text", "required": true},
    {"name": "your_department", "label": "Your Department", "type": "text", "required": true},
    {"name": "your_email", "label": "Your Email", "type": "text", "required": true}
  ]'::jsonb,
  'job',
  'global',
  true,
  true
);

-- Template 4: General Balanced
INSERT INTO recommendation_template (
  id,
  name,
  description,
  category,
  content,
  variables,
  target_program_type,
  target_region,
  is_system_template,
  is_active
) VALUES (
  'tpl_general_balanced',
  'General Balanced Recommendation',
  'A balanced template suitable for various purposes',
  'general',
  '[Date]

To Whom It May Concern,

I am pleased to recommend {{student_name}} for {{purpose}} at {{target_institution}}. I have known {{student_name}} for {{duration_known}} in my capacity as {{your_title}} at {{your_institution}}.

During our time working together, {{student_name}} has consistently demonstrated {{key_strength_1}} and {{key_strength_2}}. {{student_pronoun}} approached {{context}} with {{approach_quality}}, resulting in {{outcome}}.

{{student_name}} possesses {{quality_1}}, {{quality_2}}, and {{quality_3}}. {{specific_example}}. These qualities, combined with {{student_pronoun}} {{additional_skill}}, make {{student_object}} well-suited for {{opportunity}}.

I am confident that {{student_name}} will be an asset to {{target_institution}} and recommend {{student_object}} without reservation.

Sincerely,

{{your_name}}
{{your_title}}
{{your_institution}}
{{your_email}}
',
  '[
    {"name": "student_name", "label": "Student Name", "type": "text", "required": true, "defaultValue": "{{user.name}}"},
    {"name": "purpose", "label": "Purpose", "type": "text", "required": true},
    {"name": "target_institution", "label": "Target Institution", "type": "text", "required": true},
    {"name": "duration_known", "label": "Duration Known", "type": "text", "required": true},
    {"name": "your_title", "label": "Your Title", "type": "text", "required": true},
    {"name": "your_institution", "label": "Your Institution", "type": "text", "required": true},
    {"name": "student_pronoun", "label": "Student Pronoun", "type": "select", "required": true, "options": ["he", "she", "they"]},
    {"name": "student_object", "label": "Student Object Pronoun", "type": "select", "required": true, "options": ["him", "her", "them"]},
    {"name": "key_strength_1", "label": "Key Strength 1", "type": "text", "required": true},
    {"name": "key_strength_2", "label": "Key Strength 2", "type": "text", "required": true},
    {"name": "context", "label": "Context", "type": "text", "required": true},
    {"name": "approach_quality", "label": "Approach/Quality", "type": "text", "required": true},
    {"name": "outcome", "label": "Outcome", "type": "textarea", "required": true},
    {"name": "quality_1", "label": "Quality 1", "type": "text", "required": true},
    {"name": "quality_2", "label": "Quality 2", "type": "text", "required": true},
    {"name": "quality_3", "label": "Quality 3", "type": "text", "required": true},
    {"name": "specific_example", "label": "Specific Example", "type": "textarea", "required": true},
    {"name": "additional_skill", "label": "Additional Skill", "type": "text", "required": true},
    {"name": "opportunity", "label": "Opportunity", "type": "text", "required": true},
    {"name": "your_name", "label": "Your Name", "type": "text", "required": true},
    {"name": "your_email", "label": "Your Email", "type": "text", "required": true}
  ]'::jsonb,
  'any',
  'global',
  true,
  true
);

-- Template 5: US-Style (Formal & Detailed)
INSERT INTO recommendation_template (
  id,
  name,
  description,
  category,
  content,
  variables,
  target_program_type,
  target_region,
  is_system_template,
  is_active
) VALUES (
  'tpl_us_style',
  'US-Style Formal Recommendation',
  'Formal, detailed recommendation following US conventions',
  'country_specific',
  '[Date]

{{target_admissions_committee}}
{{target_institution}}
{{target_department}} - {{target_program}}

RE: Letter of Recommendation for {{student_name}}

Dear {{target_admissions_committee}},

It is my distinct pleasure to provide this letter of recommendation for {{student_name}} in support of {{student_pronoun}} application to the {{target_program}} at {{target_institution}}. I have known {{student_name}} since {{when_met}} in my capacity as {{your_title}} at {{your_institution}}, and I am delighted to recommend {{student_object}} without reservation.

Academic Excellence
{{student_name}} has consistently demonstrated outstanding academic ability. {{student_pronoun}} has maintained a GPA of {{student_gpa}} while completing a rigorous curriculum that included {{challenging_courses}}. In my {{course_name}} course, {{student_pronoun}} earned a {{grade}}, placing {{student_object}} in the top {{top_percent}} of the class. {{student_pronoun}} particular strength in {{subject_area}} was evident through {{specific_evidence}}.

Research and Project Experience
{{student_name}} has demonstrated exceptional research capability through {{research_experience}}. Under my supervision, {{student_pronoun}} worked on {{project_description}}, where {{student_pronoun}} {{contribution}}. This work demonstrated {{student_pronoun}} ability to {{skill_demonstrated}} and resulted in {{outcome}}.

Personal Qualities and Character
Beyond {{student_pronoun}} academic and technical abilities, {{student_name}} possesses the personal qualities that predict success at the graduate level. {{student_pronoun}} is {{quality_1}}, {{quality_2}}, and {{quality_3}}. I have been particularly impressed by {{student_pronoun}} {{specific_quality}}. {{anecdote}}.

Fit for the Program
{{student_name}}''s research interests in {{research_interests}} align closely with the strengths of your program. I am confident that {{student_pronoun}} will thrive in your academic community and make meaningful contributions to {{field}}. {{student_pronoun}} background in {{background_area}} has prepared {{student_object}} well for the challenges of graduate study.

Conclusion
I strongly recommend {{student_name}} for admission to your {{target_program}}. {{student_pronoun}} represents the very best of our student body and has the intellectual curiosity, technical skills, and personal qualities to succeed at the highest level. I expect {{student_object}} to develop into an outstanding {{professional_role}}.

Please do not hesitate to contact me if you require any additional information.

Sincerely,

{{signature}}

{{your_name}}, {{your_title}}
{{your_department}}
{{your_institution}}
{{your_email}}
{{your_phone}}
',
  '[
    {"name": "target_admissions_committee", "label": "Admissions Committee", "type": "text", "required": true},
    {"name": "target_institution", "label": "Target Institution", "type": "text", "required": true},
    {"name": "target_department", "label": "Target Department", "type": "text", "required": true},
    {"name": "target_program", "label": "Target Program", "type": "text", "required": true},
    {"name": "student_name", "label": "Student Name", "type": "text", "required": true, "defaultValue": "{{user.name}}"},
    {"name": "student_pronoun", "label": "Student Pronoun", "type": "select", "required": true, "options": ["he", "she", "they"]},
    {"name": "student_object", "label": "Student Object Pronoun", "type": "select", "required": true, "options": ["him", "her", "them"]},
    {"name": "when_met", "label": "When You Met", "type": "text", "required": true},
    {"name": "your_title", "label": "Your Title", "type": "text", "required": true},
    {"name": "your_institution", "label": "Your Institution", "type": "text", "required": true},
    {"name": "student_gpa", "label": "Student GPA", "type": "text", "required": true},
    {"name": "challenging_courses", "label": "Challenging Courses", "type": "textarea", "required": true},
    {"name": "course_name", "label": "Course Name", "type": "text", "required": true},
    {"name": "grade", "label": "Grade", "type": "text", "required": true},
    {"name": "top_percent", "label": "Top Percent", "type": "text", "required": true},
    {"name": "subject_area", "label": "Subject Area", "type": "text", "required": true},
    {"name": "specific_evidence", "label": "Specific Evidence", "type": "textarea", "required": true},
    {"name": "research_experience", "label": "Research Experience", "type": "textarea", "required": true},
    {"name": "project_description", "label": "Project Description", "type": "textarea", "required": true},
    {"name": "contribution", "label": "Contribution", "type": "textarea", "required": true},
    {"name": "skill_demonstrated", "label": "Skill Demonstrated", "type": "text", "required": true},
    {"name": "outcome", "label": "Outcome", "type": "textarea", "required": true},
    {"name": "quality_1", "label": "Quality 1", "type": "text", "required": true},
    {"name": "quality_2", "label": "Quality 2", "type": "text", "required": true},
    {"name": "quality_3", "label": "Quality 3", "type": "text", "required": true},
    {"name": "specific_quality", "label": "Specific Quality", "type": "text", "required": true},
    {"name": "anecdote", "label": "Anecdote", "type": "textarea", "required": true},
    {"name": "research_interests", "label": "Research Interests", "type": "textarea", "required": true},
    {"name": "field", "label": "Field", "type": "text", "required": true},
    {"name": "background_area", "label": "Background Area", "type": "text", "required": true},
    {"name": "professional_role", "label": "Professional Role", "type": "text", "required": true},
    {"name": "signature", "label": "Signature", "type": "text", "required": false, "description": "Optional signature text"},
    {"name": "your_name", "label": "Your Name", "type": "text", "required": true},
    {"name": "your_department", "label": "Your Department", "type": "text", "required": true},
    {"name": "your_email", "label": "Your Email", "type": "text", "required": true},
    {"name": "your_phone", "label": "Your Phone", "type": "text", "required": true}
  ]'::jsonb,
  'any',
  'us',
  true,
  true
);
```

---

## Drizzle ORM Integration

After creating the migration, update the Drizzle schema file:

```typescript
// In src/server/db/schema.ts

// Add these imports if not already present
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Add the three tables defined above to your schema exports

export const recommendationTemplate = /* as defined above */;
export const recommendationLetter = /* as defined above */;
export const studentProfileData = /* as defined above */;
```

---

## Type Definitions

Create TypeScript types for better type safety:

```typescript
// Create src/server/db/types/recommendation.ts

export type RecommendationTemplate = typeof recommendationTemplate.$inferSelect;
export type NewRecommendationTemplate = typeof recommendationTemplate.$inferInsert;

export type RecommendationLetter = typeof recommendationLetter.$inferSelect;
export type NewRecommendationLetter = typeof recommendationLetter.$inferInsert;

export type StudentProfileData = typeof studentProfileData.$inferSelect;
export type NewStudentProfileData = typeof studentProfileData.$inferInsert;

export type TemplateVariable = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "multiselect";
  required: boolean;
  defaultValue?: string;
  description?: string;
  options?: string[];
};

export type LetterStatus = "draft" | "completed" | "exported";
export type TemplateCategory = "research" | "academic" | "industry" | "general" | "country_specific";
export type TargetProgramType = "phd" | "masters" | "job" | "funding" | "any";
export type TargetRegion = "us" | "uk" | "eu" | "asia" | "global" | null;
```

---

## Testing the Schema

After running the migration, test the schema:

```sql
-- Test template table
SELECT * FROM recommendation_template LIMIT 1;

-- Test letter table (should be empty)
SELECT COUNT(*) FROM recommendation_letter;

-- Test profile table (should be empty)
SELECT COUNT(*) FROM student_profile_data;

-- Test indexes
SELECT indexname FROM pg_indexes WHERE tablename LIKE 'recommendation%';

-- Test foreign key constraints
DELETE FROM "user" WHERE id = 'test-id'; -- Should cascade to student_profile_data and recommendation_letter
```

---

## Migration Checklist

- [ ] Create migration file with timestamp
- [ ] Add all three tables to migration
- [ ] Add all indexes to migration
- [ ] Add foreign key constraints
- [ ] Add seed data for 5 templates
- [ ] Test migration locally
- [ ] Review migration with team
- [ ] Document any breaking changes
- [ ] Create rollback migration
- [ ] Deploy to development environment
- [ ] Verify in development database
- [ ] Deploy to staging environment
- [ ] Verify in staging database
- [ ] Plan production deployment
