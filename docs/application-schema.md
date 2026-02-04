# Application Schema Documentation

Complete database schema documentation for IOESU platform. Tables are organized by module and include file locations for quick reference.

## Table of Contents

- [Core Authentication Tables](#core-authentication-tables)
- [Resource Library Tables](#resource-library-tables)
- [Scholarship Tables](#scholarship-tables)
- [Taxonomy Tables](#taxonomy-tables)
- [University & College Tables](#university--college-tables)
- [Recommendation Letter Generator Tables](#recommendation-letter-generator-tables)
- [Resume Builder Tables](#resume-builder-tables)
- [GPA Converter Tables](#gpa-converter-tables)
- [Study Planner Tables](#study-planner-tables)
- [Course Explorer Tables](#course-explorer-tables)

---

## Core Authentication Tables

**Location:** `src/server/db/schema.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `user` | User accounts and profile information | `id` (text) |
| `session` | User authentication sessions | `id` (text) |
| `account` | OAuth-linked external accounts | `id` (text) |
| `verification` | Email verification tokens | `id` (text) |
| `apikey` | API keys for programmatic access | `id` (text) |
| `two_factor` | Two-factor authentication secrets | `id` (text) |
| `user_profile` | Extended user profile data | `id` (text) |
| `post` | Demo/posts table (example) | `id` (integer) |

### Key Relationships
- `session.userId` → `user.id` (cascade)
- `account.userId` → `user.id` (cascade)
- `apikey.userId` → `user.id` (cascade)
- `two_factor.userId` → `user.id` (cascade)
- `user_profile.userId` → `user.id` (cascade, unique)

---

## Resource Library Tables

**Location:** `src/server/db/schema/resources.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `resource_category` | Categories for organizing resources | `id` (text) |
| `resource_content_type` | Types of resources (Tool, Ebook, Guide, etc.) | `id` (text) |
| `resource` | Main resource records with metadata | `id` (text) |
| `resource_attachment` | File or URL attachments for resources | `id` (text) |
| `resource_to_category` | Junction table for resource-category relationships | Composite (`resourceId`, `categoryId`) |

### Key Relationships
- `resource.contentTypeId` → `resource_content_type.id` (set null)
- `resource.uploaderId` → `user.id` (set null)
- `resource_attachment.resourceId` → `resource.id` (cascade)
- `resource_to_category.resourceId` → `resource.id` (cascade)
- `resource_to_category.categoryId` → `resource_category.id` (cascade)

---

## Scholarship Tables

**Location:** `src/server/db/schema/scholarships.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `scholarship` | Main scholarship information | `id` (text) |
| `scholarship_round` | Application rounds for scholarships | `id` (text) |
| `round_event` | Events associated with scholarship rounds | `id` (text) |
| `user_application` | User applications to scholarship rounds | `id` (text) |
| `scholarship_to_country` | Junction: scholarships to countries | Composite (`scholarshipId`, `countryCode`) |
| `scholarship_to_field` | Junction: scholarships to fields of study | Composite (`scholarshipId`, `fieldId`) |
| `scholarship_to_degree` | Junction: scholarships to degree levels | Composite (`scholarshipId`, `degreeId`) |

### Key Relationships
- `scholarship_round.scholarshipId` → `scholarship.id` (cascade)
- `round_event.roundId` → `scholarship_round.id` (cascade)
- `user_application.roundId` → `scholarship_round.id` (cascade)
- `user_application.userId` → `user.id` (cascade)
- `scholarship_to_country.countryCode` → `countries.code` (cascade)
- `scholarship_to_field.fieldId` → `fields_of_study.id` (cascade)
- `scholarship_to_degree.degreeId` → `degree_level.id` (cascade)

---

## Taxonomy Tables

**Location:** `src/server/db/schema/taxonomy.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `country` | Countries with ISO codes and regions | `code` (text, ISO code) |
| `degree_level` | Academic degree levels (Bachelors, Masters, PhD) | `id` (text) |
| `field_of_study` | Fields of study/disciplines | `id` (text) |

### Key Relationships
All taxonomy tables have optional `createdById` and `updatedById` referencing `user.id` (set null).

---

## University & College Tables

**Location:** `src/server/db/schema/universities.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `university` | University information | `id` (text) |
| `college` | Colleges within universities | `id` (text) |
| `department` | Academic departments (master) | `id` (text) |
| `college_department` | Junction: colleges to departments | `id` (text) |
| `academic_program` | Academic programs | `id` (text) |
| `academic_course` | Academic courses | `id` (text) |
| `collegedepartment_to_program` | Junction: college departments to programs | `id` (text) |
| `collegeprogram_to_course` | Junction: college department programs to courses | `id` (text) |
| `rating_category` | Categories for rating entities | `id` (text) |
| `rating` | User ratings/reviews | `id` (text) |

### Rating Junction Tables
| Table | Description | Primary Key |
|-------|-------------|--------------|
| `university_to_rating` | Ratings for universities | Composite (`universityId`, `ratingId`) |
| `college_to_rating` | Ratings for colleges | Composite (`collegeId`, `ratingId`) |
| `department_to_rating` | Ratings for departments | Composite (`departmentId`, `ratingId`) |
| `collegedepartment_to_rating` | Ratings for college departments | Composite (`collegeDepartmentId`, `ratingId`) |
| `program_to_rating` | Ratings for programs | Composite (`programId`, `ratingId`) |
| `collegedepartmentprogram_to_rating` | Ratings for college department programs | Composite (`collegeDepartmentProgramId`, `ratingId`) |
| `course_to_rating` | Ratings for courses | Composite (`courseId`, `ratingId`) |
| `collegedepartmentprogramcourse_to_rating` | Ratings for college department program courses | Composite (`collegeDepartmentProgramToCourseId`, `ratingId`) |

### Key Relationships
- `college.universityId` → `university.id` (cascade)
- `college_department.collegeId` → `college.id` (cascade)
- `college_department.departmentId` → `department.id` (cascade)
- `collegedepartment_to_program.collegeDepartmentId` → `college_department.id` (cascade)
- `collegedepartment_to_program.programId` → `academic_program.id` (cascade)
- `collegeprogram_to_course.programId` → `collegedepartment_to_program.id` (cascade)
- `collegeprogram_to_course.courseId` → `academic_course.id` (cascade)
- `rating.userId` → `user.id` (cascade)
- `rating.ratingCategoryId` → `rating_category.id` (set null)

---

## Recommendation Letter Generator Tables

**Location:** `src/server/db/schema/recommendations.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `recommendation_template` | Templates for recommendation letters | `id` (text) |
| `recommendation_letter` | Generated recommendation letters | `id` (text) |
| `saved_recommender` | Saved recommender profiles for reuse | `id` (text) |
| `saved_target_institution` | Saved target institution data for reuse | `id` (text) |
| `saved_template_variables` | Saved template variable sets for reuse | `id` (text) |
| `student_profile_data` | Academic and profile data for recommendations | `id` (text) |

### Key Relationships
- `recommendation_letter.studentId` → `user.id` (cascade)
- `recommendation_letter.templateId` → `recommendation_template.id` (set null)
- `saved_recommender.userId` → `user.id` (cascade)
- `saved_target_institution.userId` → `user.id` (cascade)
- `saved_template_variables.userId` → `user.id` (cascade)
- `saved_template_variables.templateId` → `recommendation_template.id` (cascade)
- `student_profile_data.userId` → `user.id` (cascade, unique)

---

## Resume Builder Tables

**Location:** `src/server/db/schema/resume.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `resume_profile` | Main resume profile | `id` (text) |
| `work_experience` | Work experience entries | `id` (text) |
| `education_record` | Education records | `id` (text) |
| `project_record` | Project records | `id` (text) |
| `user_skill` | Skills organized by category | `id` (text) |
| `language_skill` | Language proficiency | `id` (text) |
| `position_of_responsibility_record` | Leadership/volunteering positions | `id` (text) |
| `certification_record` | Certifications and credentials | `id` (text) |
| `reference_record` | Professional references | `id` (text) |
| `resume` | Generated resume configurations | `id` (text) |

### Key Relationships
All resume-related tables reference `resume_profile.id` (cascade).

---

## GPA Converter Tables

**Location:** `src/server/db/schema/gpa-converter.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `gpa_conversion_standard` | GPA conversion standards (WES, Scholaro, etc.) | `id` (text) |
| `gpa_conversion_range` | Percentage to GPA mapping ranges | `id` (text) |
| `gpa_conversion` | User-specific GPA conversions | `id` (text) |

### Key Relationships
- `gpa_conversion_range.standardId` → `gpa_conversion_standard.id` (cascade)
- `gpa_conversion.userId` → `user.id` (cascade)
- `gpa_conversion.standardId` → `gpa_conversion_standard.id` (cascade)

---

## Study Planner Tables

**Location:** `src/server/db/schema/study-planners.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `academic_event` | Exams, assignments, projects, labs | `id` (uuid) |
| `study_templates` | Predefined study plan templates | `id` (uuid) |
| `study_plans` | User study plans | `id` (uuid) |
| `study_tasks` | Individual tasks within study plans | `id` (uuid) |
| `study_logs` | Time tracking logs for tasks | `id` (uuid) |

### Key Relationships
- `academic_event.userId` → `user.id` (cascade)
- `study_plans.userId` → `user.id` (cascade)
- `study_plans.templateId` → `study_templates.id` (optional)
- `study_tasks.studyPlanId` → `study_plans.id` (cascade)
- `study_logs.taskId` → `study_tasks.id` (cascade)
- `study_logs.userId` → `user.id` (cascade)

---

## Course Explorer Tables

**Location:** `src/server/db/schema/units.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `course_unit` | Units/modules/chapters within courses | `id` (text) |

**Location:** `src/server/db/schema/topics.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `course_topic` | Topics within units (hierarchical) | `id` (text) |

**Location:** `src/server/db/schema/prerequisites.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `topic_prerequisite` | Topic prerequisite dependencies | `id` (text) |
| `unit_prerequisite` | Unit prerequisite dependencies | `id` (text) |

**Location:** `src/server/db/schema/resource-links.ts`

| Table | Description | Primary Key |
|-------|-------------|--------------|
| `topic_resource_link` | Links between topics and resources | `id` (text) |
| `resource_tag` | Tags for resources | `id` (text) |

### Key Relationships
- `course_unit.courseId` → `academic_course.id` (cascade)
- `course_topic.unitId` → `course_unit.id` (cascade)
- `course_topic.parentTopicId` → `course_topic.id` (set null, self-reference)
- `topic_prerequisite.topicId` → `course_topic.id` (cascade)
- `topic_prerequisite.prerequisiteTopicId` → `course_topic.id` (cascade)
- `unit_prerequisite.unitId` → `course_unit.id` (cascade)
- `unit_prerequisite.prerequisiteUnitId` → `course_unit.id` (cascade)
- `topic_resource_link.topicId` → `course_topic.id` (cascade)
- `topic_resource_link.resourceId` → `resource.id` (cascade)
- `resource_tag.resourceId` → `resource.id` (cascade)

---

## Common Patterns

### Audit Fields
Most tables include:
- `createdAt` - Auto-generated timestamp on creation
- `updatedAt` - Auto-updated timestamp on modification

### User Tracking
Tables that track creation/modification by users include:
- `createdById` - References `user.id` (set null on delete)
- `updatedById` - References `user.id` (set null on delete)

### Soft Delete
- `gpa_conversion.is_deleted` - Soft delete flag
- Most tables use cascade delete instead

### Active Status
Many tables include `isActive` boolean for soft disabling.

---

## Schema File Organization

```
src/server/db/
├── schema.ts                          # Core auth + imports
└── schema/
    ├── scholarships.ts                  # Scholarship system
    ├── universities.ts                 # University & college hierarchy
    ├── taxonomy.ts                     # Countries, degrees, fields
    ├── resources.ts                    # Resource library
    ├── recommendations.ts               # Recommendation letters
    ├── resume.ts                       # Resume builder
    ├── gpa-converter.ts                # GPA conversion
    ├── study-planners.ts               # Study planner
    ├── units.ts                        # Course units
    ├── topics.ts                       # Course topics
    ├── prerequisites.ts                # Topic/unit prerequisites
    └── resource-links.ts               # Topic-resource links
```
