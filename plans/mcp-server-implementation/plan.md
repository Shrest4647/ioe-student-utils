# MCP Server Implementation Plan - Updated

## Overview

This plan outlines tools, resources, and capabilities needed for IOESU MCP server to enable AI agents to manage and maintain website data and content programmatically.

**Current Status**: 
- ✅ MCP server foundation completed using `mcp-handler`
- ✅ Authentication with Better Auth API keys
- ✅ Sample tool: `fetch_scholarships`
- ⏳ Additional tools, resources, and prompts to be implemented

### Primary Use Cases

- **Content Management**: Add, update, remove scholarships, universities, resources
- **Data Operations**: Bulk import/export, validation, cleanup
- **Search & Discovery**: Find and analyze scholarships, universities, opportunities
- **User Data**: Manage resumes, recommendations, GPA conversions
- **Analytics**: Generate insights from application data
- **Quality Assurance**: Validate data integrity, identify duplicates

### Target Audience

- AI coding assistants (Claude Desktop, Cursor, Windsurf)
- Custom AI agents for automated content management
- Admin users managing large-scale data operations
- External integrations with AI-powered services

---

## Architecture Summary

### Current Implementation

**Technology**: Vercel `mcp-handler`
- Location: `/src/server/mcp/server.ts`
- Route: `/src/app/api/mcp/[transport]/route.ts` (supports multiple transports)
- Auth: Better Auth API Key plugin
- **Transport**: **HTTPStreaming** (default) - NOT SSE

### Transport Configuration

The MCP server supports multiple transports via dynamic routing:
- `/api/mcp/mcp` - HTTPStreaming transport (recommended default)
- `/api/mcp/sse` - Server-Sent Events transport

**Recommended transport**: **HTTPStreaming** for Claude Desktop and other AI clients.

### Tool Development Pattern

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "@/server/elysia/eden";
import { appEnv } from "@/env";
import { formatDate, truncateText } from "../utils";

// Infer types from Eden API
type EntityQuery = NonNullable<
  Parameters<typeof api.api.[domain].get>[0]
>["query"];
type EntityResponse = NonNullable<
  Awaited<ReturnType<typeof api.api.[domain].get>>["data"]
>;
type Entity = EntityResponse["data"][number];

export function registerDomainTools(server: McpServer): void {
  server.registerTool(
    "tool_name",
    {
      title: "Tool Title",
      description: "Comprehensive description...",
      inputSchema: z.object({...}),
    },
    async (params, _requestContext) => {
      try {
        const apiKey = requestContext?.authInfo?.token;
        if (!apiKey) {
          throw new Error("MCP Authorization key is not configured. Please supply an API key in the request header.");
        }

        // Use Eden API client (NEVER direct database access)
        const response = await api.api.[domain].[method]({
          headers: { Authorization: `Bearer ${apiKey}` },
          query/body: params,
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.error?.value?.message || "Request failed");
        }

        // Format results
        const formattedResults = response.data.data.map(item => ({
          ...item,
          createdAt: formatDate(item.createdAt),
          description: truncateText(item.description, 500),
        }));

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              data: formattedResults,
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error("tool_name error:", error);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : "Operation failed"
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  );
}
```

### Key Architecture Rules

1. **✅ DO**: Use Eden API client from `@/server/elysia/eden.ts`
2. **❌ DON'T**: Access database directly in MCP tools
3. **✅ DO**: Infer types from Eden API for type safety
4. **✅ DO**: Handle bulk operations internally (looping in tool logic)
5. **✅ DO**: Use consistent error handling and response formatting
6. **✅ DO**: Follow `fetch_scholarships.ts` pattern
7. **✅ DO**: Use `formatDate`, `truncateText` utilities from `utils.ts`

---

## MCP Tools - Complete List

### 1. Scholarship Management Tools (`scholarships.ts`)

#### Existing ✅
- `fetch_scholarships`: Retrieve scholarships with filtering and pagination
- `create_scholarship`: Create new scholarship with full metadata
- `bulk_create_scholarships`: Create multiple scholarships efficiently
- `update_scholarship`: Update existing scholarship details
- `bulk_update_scholarships`: Update multiple scholarships efficiently
- `delete_scholarship`: Soft delete (archive) scholarship
- `bulk_delete_scholarships`: Delete multiple scholarships
- `get_scholarship_by_id`: Get single scholarship with full relations
- `create_scholarship_round`: Add application round to scholarship
- `bulk_create_scholarship_rounds`: Create multiple rounds for a scholarship
- `update_scholarship_round`: Update round details
- `create_round_event`: Add event to round
- `bulk_create_round_events`: Create multiple events for a round
- `update_round_event`: Update event details
- `delete_round_event`: Remove event

#### To Implement ⏳
- `delete_scholarship_round` (not yet in MCP, but API exists)
- `bulk_delete_round_events` (utility exists, but tool not registered)
- `bulk_update_round_events` (utility exists, but tool not registered)

---

### 2. University Management Tools (`universities.ts`)

#### To Implement ⏳

**`fetch_universities`**
- Purpose: Retrieve universities with filtering
- Parameters:
  - `limit` (number, default: 20)
  - `offset` (number, default: 0)
  - `search` (string): Search by name
  - `country` (string): Filter by country code
  - `isActive` (boolean): Filter by status
- Returns: Universities with pagination
- API Call: `GET /api/universities`
- Type Inference:
  ```typescript
  export type UniversityQuery = NonNullable<
    Parameters<typeof api.api.universities.get>[0]
  >["query"];
  export type UniversityResponse = NonNullable<
    Awaited<ReturnType<typeof api.api.universities.get>>["data"]
  >;
  ```

**`create_university`**
- Purpose: Add new university
- Parameters:
  - `name` (string): University name
  - `slug` (string): URL identifier
  - `description` (string): Description
  - `websiteUrl` (string): Official website
  - `logoUrl` (string): Logo S3 URL
  - `establishedYear` (string): Founding year
  - `location` (string): City/region
  - `country` (string): Country name
  - `isActive` (boolean): Active status
- Returns: Created university with ID and slug
- API Call: `POST /api/universities/admin`

**`bulk_create_universities`**
- Purpose: Create multiple universities efficiently
- Parameters:
  - `universities` (array): Array of university objects
  - `onError` (enum): continue, abort
- Returns: Bulk operation results with summary
- Implementation: Loop and call create API for each

**`update_university`**
- Purpose: Update university details
- Parameters: University ID + updatable fields
- Returns: Updated university
- API Call: `PATCH /api/universities/admin/:id`

**`bulk_update_universities`**
- Purpose: Update multiple universities
- Parameters: `updates` (array of `{ id, ...updates }`)
- Returns: Bulk operation results

**`delete_university`**
- Purpose: Archive university
- Parameters: `id` (string): University ID
- Returns: Success confirmation
- API Call: `DELETE /api/universities/admin/:id` (if exists) or PATCH

**`bulk_delete_universities`**
- Purpose: Delete multiple universities
- Parameters: `ids` (array)
- Returns: Bulk operation results

**`create_college`**
- Purpose: Add college to university
- Parameters:
  - `universityId` (string): Parent university
  - `name` (string): College name
  - `slug` (string): URL identifier
  - `type` (string): Constituent/Affiliated
  - `description` (string): College description
  - `websiteUrl` (string): College website
  - `location` (string): Location
  - `isActive` (boolean): Active status
- Returns: Created college
- API Call: `POST /api/colleges/admin` (if exists)

**`bulk_create_colleges`**
- Purpose: Create multiple colleges
- Parameters:
  - `colleges` (array): Array of college objects
  - `onError` (enum): continue, abort
- Returns: Bulk operation results

**`update_college`**
- Purpose: Update college details
- Parameters: College ID + updatable fields
- Returns: Updated college
- API Call: `PATCH /api/colleges/admin/:id`

**`delete_college`**
- Purpose: Remove college
- Parameters: `id` (string): College ID
- Returns: Success confirmation

**`create_department`**
- Purpose: Add department
- Parameters:
  - `name` (string): Department name
  - `slug` (string): URL identifier
  - `description` (string): Description
  - `websiteUrl` (string): Website
  - `isActive` (boolean): Active status
- Returns: Created department
- API Call: `POST /api/departments/admin` (if exists)

**`create_college_department`**
- Purpose: Link department to college
- Parameters:
  - `collegeId` (string): College ID
  - `departmentId` (string): Department ID
  - `description` (string): Custom description
  - `websiteUrl` (string): Custom website
  - `isActive` (boolean): Active status
- Returns: Created link
- API Call: `POST /api/colleges/:id/departments` (or similar)

**`bulk_create_college_departments`**
- Purpose: Create multiple college-department links
- Parameters:
  - `links` (array): Array of link objects
  - `onError` (enum): continue, abort
- Returns: Bulk operation results

**`update_college_department`**
- Purpose: Update college-department link
- Parameters: Link ID + updatable fields
- Returns: Updated link

**`delete_college_department`**
- Purpose: Remove link
- Parameters: `id` (string): Link ID
- Returns: Success confirmation

---

### 3. Academic Program & Course Tools (`academic.ts`)

#### To Implement ⏳

**`fetch_programs`**
- Purpose: Retrieve academic programs
- Parameters:
  - `limit`, `offset`, `search`, `degreeLevels` (enum), `isActive`
- Returns: Programs with pagination
- API Call: `GET /api/programs` (if exists)

**`create_program`**
- Purpose: Add academic program
- Parameters:
  - `name` (string): Program name
  - `code` (string): Program code
  - `description` (string): Description
  - `credits` (string): Credit hours
  - `degreeLevels` (enum): certificate, diploma, associate, undergraduate, postgraduate, doctoral, postdoctoral
  - `isActive` (boolean): Active status
- Returns: Created program
- API Call: `POST /api/programs/admin` (if exists)

**`bulk_create_programs`**
- Purpose: Create multiple programs
- Parameters:
  - `programs` (array)
  - `onError` (enum): continue, abort
- Returns: Bulk operation results

**`update_program`** / **`delete_program`**
- Manage programs via API calls

**`fetch_courses`**
- Purpose: Retrieve courses
- Parameters: `limit`, `offset`, `search`, `isActive`
- Returns: Courses
- API Call: `GET /api/courses` (if exists)

**`create_course`**
- Purpose: Add course
- Parameters: name, code, description, credits, isActive
- Returns: Created course

**`bulk_create_courses`**
- Purpose: Create multiple courses
- Returns: Bulk operation results

**`update_course`** / **`delete_course`**
- Manage courses via API

**`link_program_to_college_department`**
- Purpose: Link program to college-department
- Parameters:
  - `collegeDepartmentId` (string)
  - `programId` (string)
  - `code` (string): Custom code
  - `description` (string): Custom description
  - `credits` (string): Custom credits
- Returns: Created link
- API Call: `POST /api/colleges/departments/:id/programs` (if exists)

**`bulk_link_programs`**
- Purpose: Link multiple programs
- Parameters: `links` (array)
- Returns: Bulk operation results

**`update_program_link`** / **`delete_program_link`**
- Manage program links

**`link_course_to_program`**
- Purpose: Link course to college-department program
- Parameters:
  - `programId` (string): College-department program ID
  - `courseId` (string): Course ID
  - Custom fields
- Returns: Created link

**`bulk_link_courses`**
- Purpose: Link multiple courses
- Returns: Bulk operation results

---

### 4. Rating System Tools (`ratings.ts`)

#### To Implement ⏳

**`fetch_rating_categories`**
- Purpose: Get all rating categories
- Returns: Categories (e.g., "Academics", "Campus Life")
- API Call: `GET /api/ratings/categories` (if exists)

**`create_rating_category`**
- Purpose: Add rating category
- Parameters:
  - `name` (string): Category name
  - `slug` (string): URL identifier
  - `description` (string): Description
  - `sortOrder` (string): Display order
  - `isActive` (boolean): Active status
- Returns: Created category
- API Call: `POST /api/ratings/categories/admin` (if exists)

**`bulk_create_rating_categories`**
- Purpose: Create multiple categories
- Returns: Bulk operation results

**`update_rating_category`** / **`delete_rating_category`**
- Manage categories

**`fetch_ratings`**
- Purpose: Get ratings for entity
- Parameters:
  - `entityType` (enum): university, college, department, college_department, program, college_program, course, college_program_course
  - `entityId` (string): Entity ID
  - `categoryId` (string): Optional filter by category
  - `isVerified` (boolean): Filter verification status
- Returns: Ratings with pagination
- API Call: `GET /api/ratings` or entity-specific route

**`submit_rating`**
- Purpose: Add rating
- Parameters:
  - `entityType` (enum)
  - `entityId` (string)
  - `rating` (string): Rating value (e.g., "4.5", "5")
  - `review` (string): Review text
  - `ratingCategoryId` (string): Category ID
- Returns: Created rating
- API Call: `POST /api/ratings` (if exists)

**`bulk_submit_ratings`**
- Purpose: Submit multiple ratings
- Parameters: `ratings` (array)
- Returns: Bulk operation results

**`verify_rating`**
- Purpose: Mark rating as verified (admin)
- Parameters: `ratingId` (string), `isVerified` (boolean)
- Returns: Updated rating
- API Call: `PATCH /api/ratings/admin/:id` (if exists)

**`bulk_verify_ratings`**
- Purpose: Verify multiple ratings
- Parameters: `updates` (array of `{ ratingId, isVerified }`)
- Returns: Bulk operation results

**`update_rating`** / **`delete_rating`**
- Manage ratings via API

---

### 5. Resource Library Tools (`resources.ts`)

#### To Implement ⏳

**`fetch_resources`**
- Purpose: Retrieve resources
- Parameters:
  - `limit`, `offset`
  - `search` (string): Search title/description
  - `contentTypeId` (string): Filter by type (Tool, Ebook, Guide)
  - `categoryId` (string): Filter by category
  - `isFeatured` (boolean): Featured resources
- Returns: Resources with pagination
- API Call: `GET /api/resources`

**`create_resource`**
- Purpose: Upload and create resource
- Parameters:
  - `title` (string): Resource title
  - `description` (string): Description
  - `s3Url` (string): S3 file URL
  - `contentTypeId` (string): Content type ID
  - `isFeatured` (boolean): Featured status
  - `categoryIds` (string[]): Categories
  - `attachments` (array): Optional attachments (file/url)
- Returns: Created resource
- API Call: `POST /api/resources`

**`bulk_create_resources`**
- Purpose: Create multiple resources
- Parameters: `resources` (array)
- Returns: Bulk operation results

**`update_resource`**
- Purpose: Update resource details
- Parameters: Resource ID + updatable fields
- Returns: Updated resource
- API Call: `PATCH /api/resources/:id` (if exists)

**`delete_resource`**
- Purpose: Remove resource
- Parameters: `id` (string): Resource ID
- Returns: Success confirmation
- API Call: `DELETE /api/resources/:id` (if exists)

**`bulk_delete_resources`**
- Purpose: Delete multiple resources
- Returns: Bulk operation results

**`fetch_resource_categories`**
- Purpose: Get all categories
- Returns: Categories
- API Call: `GET /api/resources/categories`

**`create_resource_category`**
- Purpose: Add category
- Parameters: name, description
- Returns: Created category
- API Call: `POST /api/resources/categories`

**`bulk_create_resource_categories`**
- Purpose: Create multiple categories
- Returns: Bulk operation results

**`update_resource_category`** / **`delete_resource_category`**
- Manage categories

**`fetch_content_types`**
- Purpose: Get content types
- Returns: Content types
- API Call: `GET /api/resources/content-types` (if exists)

**`create_content_type`**
- Purpose: Add content type
- Parameters: name, description
- Returns: Created type

**`bulk_create_content_types`**
- Purpose: Create multiple content types
- Returns: Bulk operation results

**`update_content_type`** / **`delete_content_type`**
- Manage content types

---

### 6. Resume Builder Tools (`resumes.ts`)

#### To Implement ⏳

**`fetch_resume_profiles`**
- Purpose: Get user's resume profiles
- Parameters: `userId` (string)
- Returns: Resume profiles
- API Call: `GET /api/profiles/mine` or similar

**`create_resume_profile`**
- Purpose: Create resume profile
- Parameters:
  - `userId` (string): User ID
  - `firstName`, `lastName`, `email`, `phone`
  - `address` (object): Street, city, state, postalCode, country
  - `nationality` (string)
  - `dateOfBirth` (string): YYYY-MM
  - `photoUrl` (string): S3 URL
  - `summary` (string): Professional summary
  - `linkedIn`, `github`, `web` (string): Social links
- Returns: Created profile
- API Call: `POST /api/profiles` (if exists)

**`update_resume_profile`**
- Purpose: Update profile
- Returns: Updated profile
- API Call: `PATCH /api/profiles/:id` (if exists)

**`add_work_experience`**
- Purpose: Add work experience
- Parameters:
  - `profileId` (string)
  - `jobTitle`, `employer`
  - `startDate`, `endDate` (string): YYYY-MM
  - `city`, `country`
  - `description` (string)
  - `referenceLink` (string)
- Returns: Created experience
- API Call: `POST /api/work-experiences` (if exists)

**`bulk_add_work_experiences`**
- Purpose: Add multiple work experiences
- Parameters: `experiences` (array)
- Returns: Bulk operation results

**`update_work_experience`** / **`delete_work_experience`**
- Manage work experiences

**`add_education`**
- Purpose: Add education record
- Parameters:
  - `profileId` (string)
  - `institution`, `qualification`
  - `degreeLevel` (string): Diploma, Bachelor, Master, PhD, Certificate
  - `startDate`, `endDate`, `graduationDate` (string): YYYY-MM
  - `grade`, `gradeType` (string)
  - `description`
  - `city`, `country`
  - `referenceLink` (string)
- Returns: Created education
- API Call: `POST /api/education` (if exists)

**`bulk_add_education`**
- Purpose: Add multiple education records
- Returns: Bulk operation results

**`update_education`** / **`delete_education`**
- Manage education records

**`add_project`**
- Purpose: Add project
- Parameters:
  - `profileId` (string)
  - `name`, `description`
  - `startDate`, `endDate` (string): YYYY-MM
  - `role` (string)
  - `referenceLink` (string)
- Returns: Created project
- API Call: `POST /api/projects` (if exists)

**`bulk_add_projects`**
- Purpose: Add multiple projects
- Returns: Bulk operation results

**`update_project`** / **`delete_project`**
- Manage projects

**`add_skills`**
- Purpose: Add skill category
- Parameters:
  - `profileId` (string)
  - `category` (string): programming-language, communication, technical, organizational, databases, scores, interests
  - `skills` (array): Skill objects
- Returns: Created skills
- API Call: `POST /api/skills` (if exists)

**`bulk_add_skills`**
- Purpose: Add multiple skill categories
- Returns: Bulk operation results

**`update_skills`** / **`delete_skills`**
- Manage skills

**`add_language_skill`**
- Purpose: Add language skill
- Parameters:
  - `profileId` (string)
  - `language` (string)
  - `listening`, `reading`, `speaking`, `writing` (string): CEFR levels A1-C2
  - `referenceLink` (string)
- Returns: Created language skill
- API Call: `POST /api/language-skills` (if exists)

**`bulk_add_language_skills`**
- Purpose: Add multiple language skills
- Returns: Bulk operation results

**`update_language_skill`** / **`delete_language_skill`**
- Manage language skills

**`add_position_of_responsibility`**
- Purpose: Add position
- Parameters:
  - `profileId` (string)
  - `name`, `description`
  - `startDate`, `endDate` (string): YYYY-MM
  - `referenceLink` (string)
- Returns: Created position
- API Call: `POST /api/positions` (if exists)

**`bulk_add_positions`**
- Purpose: Add multiple positions
- Returns: Bulk operation results

**`update_position`** / **`delete_position`**
- Manage positions

**`add_certification`**
- Purpose: Add certification
- Parameters:
  - `profileId` (string)
  - `name`, `issuer`
  - `issueDate` (string): YYYY-MM
  - `credentialUrl` (string)
- Returns: Created certification
- API Call: `POST /api/certifications` (if exists)

**`bulk_add_certifications`**
- Purpose: Add multiple certifications
- Returns: Bulk operation results

**`update_certification`** / **`delete_certification`**
- Manage certifications

**`add_reference`**
- Purpose: Add reference
- Parameters:
  - `profileId` (string)
  - `name`, `title`, `relation`
  - `institution` (string)
  - `email`, `phone` (string)
- Returns: Created reference
- API Call: `POST /api/references` (if exists)

**`bulk_add_references`**
- Purpose: Add multiple references
- Returns: Bulk operation results

**`update_reference`** / **`delete_reference`**
- Manage references

**`create_resume`**
- Purpose: Create resume from profile
- Parameters:
  - `profileId` (string)
  - `name` (string): Resume name
  - `includedSections` (array): Sections with order
  - `designTheme` (object): Design metadata
- Returns: Created resume
- API Call: `POST /api/resumes` (if exists)

**`bulk_create_resumes`**
- Purpose: Create multiple resumes
- Returns: Bulk operation results

**`update_resume`** / **`delete_resume`**
- Manage resumes via API

---

### 7. Recommendation Letter Tools (`recommendations.ts`)

#### To Implement ⏳

**`fetch_recommendation_templates`**
- Purpose: Get recommendation templates
- Parameters:
  - `category` (enum): research, academic, industry, general, country_specific
  - `targetProgramType` (enum): phd, masters, job, funding, any
  - `targetRegion` (enum): us, uk, eu, asia, global
  - `isActive` (boolean)
- Returns: Templates
- API Call: `GET /api/recommendations` (if exists)

**`create_recommendation_template`**
- Purpose: Create template
- Parameters:
  - `name`, `description`
  - `category` (enum)
  - `content` (string): Template with placeholders
  - `variables` (array): Variable definitions
  - `targetProgramType` (enum)
  - `targetRegion` (enum)
  - `isSystemTemplate` (boolean)
  - `isActive` (boolean)
- Returns: Created template
- API Call: `POST /api/recommendations/templates/admin` (if exists)

**`bulk_create_recommendation_templates`**
- Purpose: Create multiple templates
- Returns: Bulk operation results

**`update_recommendation_template`** / **`delete_recommendation_template`**
- Manage templates

**`create_recommendation_letter`**
- Purpose: Generate recommendation letter
- Parameters:
  - `studentId` (string)
  - `templateId` (string)
  - `title` (string)
  - Recommender: name, title, institution, email, department
  - Target: institution, program, department, country, purpose
  - Relationship: relationship, contextOfMeeting
  - Student data: achievements, researchExperience, academicPerformance, personalQualities, customContent
- Returns: Generated letter with finalContent, pdfUrl
- API Call: `POST /api/recommendations/letters` (if exists)

**`update_recommendation_letter`**
- Purpose: Update letter
- Returns: Updated letter
- API Call: `PATCH /api/recommendations/letters/:id` (if exists)

**`export_recommendation_letter`**
- Purpose: Export to PDF/Google Doc
- Parameters: `letterId` (string), `format` (enum): pdf, google_doc
- Returns: Exported file URL

**`fetch_saved_recommenders`**
- Purpose: Get user's saved recommenders
- Parameters: `userId` (string)
- Returns: Saved recommenders
- API Call: `GET /api/recommendations/saved/recommenders` (if exists)

**`create_saved_recommender`**
- Purpose: Save recommender for reuse
- Parameters:
  - `userId` (string)
  - name, title, institution, department
  - email, phone
  - relationship, contextOfMeeting
- Returns: Created saved recommender
- API Call: `POST /api/recommendations/saved/recommenders` (if exists)

**`bulk_create_saved_recommenders`**
- Purpose: Save multiple recommenders
- Returns: Bulk operation results

**`update_saved_recommender`** / **`delete_saved_recommender`**
- Manage saved recommenders

**`fetch_saved_targets`**
- Purpose: Get saved target institutions
- Parameters: `userId` (string)
- Returns: Saved targets
- API Call: `GET /api/recommendations/saved/targets` (if exists)

**`create_saved_target`** / **`update_saved_target`** / **`delete_saved_target`**
- Manage saved targets

**`fetch_saved_variables`**
- Purpose: Get saved template variable sets
- Parameters: `userId` (string), `templateId` (string)
- Returns: Saved variable sets
- API Call: `GET /api/recommendations/saved/variables` (if exists)

**`create_saved_variables`** / **`update_saved_variables`** / **`delete_saved_variables`**
- Manage saved variables

---

### 8. GPA Converter Tools (`gpa.ts`)

#### To Implement ⏳

**`fetch_gpa_standards`**
- Purpose: Get all GPA conversion standards
- Returns: Standards (e.g., WES, Scholaro)
- API Call: `GET /api/gpa-converter/standards` (if exists)

**`create_gpa_standard`**
- Purpose: Create conversion standard
- Parameters:
  - `name` (string): Standard name
  - `description` (string): Description
  - `isActive` (boolean)
- Returns: Created standard
- API Call: `POST /api/gpa-converter/standards/admin` (if exists)

**`bulk_create_gpa_standards`**
- Purpose: Create multiple standards
- Returns: Bulk operation results

**`update_gpa_standard`** / **`delete_gpa_standard`**
- Manage standards

**`create_gpa_conversion_range`**
- Purpose: Add conversion range
- Parameters:
  - `standardId` (string)
  - `minPercentage`, `maxPercentage` (string)
  - `gpaValue` (string): e.g., "4.0"
  - `gradeLabel` (string): e.g., "A"
  - `sortOrder` (string): Display order
- Returns: Created range
- API Call: `POST /api/gpa-converter/standards/:id/ranges` (if exists)

**`bulk_create_gpa_conversion_ranges`**
- Purpose: Create multiple conversion ranges
- Parameters: `ranges` (array)
- Returns: Bulk operation results

**`update_conversion_range`** / **`delete_conversion_range`**
- Manage conversion ranges

**`calculate_gpa`**
- Purpose: Calculate GPA using standard
- Parameters:
  - `userId` (string)
  - `standardId` (string)
  - `name` (string): Calculation name
  - `courseCount` (string): Number of courses
  - `cumulativeGPA`, `totalCredits`, `totalQualityPoints` (string)
  - `calculationData` (array): Course objects
- Returns: GPA conversion result
- API Call: `POST /api/gpa-converter/conversions` (if exists)

**`fetch_gpa_conversions`**
- Purpose: Get user's GPA conversions
- Parameters: `userId` (string)
- Returns: Conversions
- API Call: `GET /api/gpa-converter/conversions` (if exists)

**`update_gpa_conversion`** / **`delete_gpa_conversion`**
- Manage conversions

---

### 9. Taxonomy Management Tools (`taxonomy.ts`)

#### To Implement ⏳

**`fetch_countries`**
- Purpose: Get all countries
- Returns: Countries with code, name, region
- API Call: `GET /api/scholarships/countries` (existing route)

**`create_country`**
- Purpose: Add country
- Parameters:
  - `code` (string): ISO 2-letter code
  - `name` (string)
  - `region` (string)
- Returns: Created country
- API Call: `POST /api/countries/admin` (if exists)

**`bulk_create_countries`**
- Purpose: Create multiple countries
- Returns: Bulk operation results

**`update_country`** / **`delete_country`**
- Manage countries

**`fetch_degree_levels`**
- Purpose: Get degree levels
- Returns: Degree levels with rank
- API Call: `GET /api/scholarships/degrees` (existing route)

**`create_degree_level`**
- Purpose: Add degree level
- Parameters:
  - `name` (string)
  - `rank` (string)
- Returns: Created level
- API Call: `POST /api/degree-levels/admin` (if exists)

**`bulk_create_degree_levels`**
- Purpose: Create multiple degree levels
- Returns: Bulk operation results

**`update_degree_level`** / **`delete_degree_level`**
- Manage degree levels

**`fetch_fields_of_study`**
- Purpose: Get fields of study
- Returns: Fields
- API Call: `GET /api/scholarships/fields` (existing route)

**`create_field_of_study`**
- Purpose: Add field
- Parameters: `name` (string)
- Returns: Created field
- API Call: `POST /api/fields-of-study/admin` (if exists)

**`bulk_create_fields_of_study`**
- Purpose: Create multiple fields
- Returns: Bulk operation results

**`update_field_of_study`** / **`delete_field_of_study`**
- Manage fields

---

### 10. User & Application Tools (`users.ts`)

#### To Implement ⏳

**`fetch_users`**
- Purpose: Get users (admin)
- Parameters: `limit`, `offset`, `search`, `role`
- Returns: Users
- API Call: `GET /api/users/admin` (if exists)

**`update_user`**
- Purpose: Update user (admin)
- Parameters: `userId` (string), name, email, role, image
- Returns: Updated user
- API Call: `PATCH /api/users/admin/:id` (if exists)

**`bulk_update_users`**
- Purpose: Update multiple users
- Returns: Bulk operation results

**`fetch_user_applications`**
- Purpose: Get user's scholarship applications
- Parameters:
  - `userId` (string)
  - `status` (enum): saved, preparing, submitted, rejected, accepted
- Returns: Applications
- API Call: `GET /api/scholarships/applications` (if exists)

**`create_application`**
- Purpose: Create application
- Parameters:
  - `userId` (string)
  - `roundId` (string)
  - `personalNotes` (string)
  - `deadlineReminder` (string)
- Returns: Created application
- API Call: `POST /api/scholarships/applications` (if exists)

**`bulk_create_applications`**
- Purpose: Create multiple applications
- Returns: Bulk operation results

**`update_application`**
- Purpose: Update application
- Parameters: `applicationId` (string), status, notes
- Returns: Updated application
- API Call: `PATCH /api/scholarships/applications/:id` (if exists)

**`delete_application`**
- Purpose: Remove application
- Parameters: `applicationId` (string)
- Returns: Success confirmation

**`fetch_student_profile`**
- Purpose: Get student profile data
- Parameters: `userId` (string)
- Returns: Student profile
- API Call: `GET /api/student-profile` (if exists)

**`update_student_profile`**
- Purpose: Update student profile
- Parameters:
  - `userId` (string)
  - `gpa`, `major`, `minor`, `expectedGraduation`
  - `researchInterests`, `skills`, `achievements`, `projects`
  - `workExperience`, `extracurricular`, `careerGoals`
- Returns: Updated profile
- API Call: `PATCH /api/student-profile` (if exists)

---

### 11. Data Validation & Cleanup Tools (`validation.ts`)

#### To Implement ⏳

**`validate_data_integrity`**
- Purpose: Check data integrity
- Parameters:
  - `entityType` (enum): scholarships, universities, resources, etc.
  - `checkOrphans` (boolean): Check orphaned records
  - `checkRelations` (boolean): Validate relations
- Returns: Validation report with issues
- API Call: `GET /api/admin/validate` (if exists)

**`find_duplicate_records`**
- Purpose: Find potential duplicates
- Parameters:
  - `entityType` (enum)
  - `fields` (string[]): Fields to compare
  - `similarityThreshold` (number): 0-1
- Returns: Duplicate groups
- API Call: `GET /api/admin/duplicates` (if exists)

**`cleanup_orphans`**
- Purpose: Remove orphaned records
- Parameters:
  - `entityType` (enum)
  - `dryRun` (boolean): Preview without deleting
- Returns: Deleted records count
- API Call: `POST /api/admin/cleanup` (if exists)

**`bulk_import_data`**
- Purpose: Import data from CSV/JSON
- Parameters:
  - `entityType` (enum)
  - `data` (array): Records to import
  - `dryRun` (boolean): Preview without importing
  - `onConflict` (enum): skip, update, error
- Returns: Import results (success, failed, skipped)
- API Call: `POST /api/admin/import` (if exists)
- Implementation: Loop through data array, call create API for each, collect results

**`bulk_update_data`**
- Purpose: Bulk update records
- Parameters:
  - `entityType` (enum)
  - `updates` (array): Update criteria and values
  - `dryRun` (boolean)
- Returns: Update results
- API Call: `POST /api/admin/bulk-update` (if exists)

---

### 12. Analytics & Reporting Tools (`analytics.ts`)

#### To Implement ⏳

**`get_scholarship_analytics`**
- Purpose: Scholarship statistics
- Parameters:
  - `dateRange` (object): startDate, endDate
  - `groupBy` (enum): funding_type, status, country, field, degree
- Returns: Analytics data
- API Call: `GET /api/analytics/scholarships` (if exists)

**`get_user_analytics`**
- Purpose: User statistics
- Parameters: `dateRange` (object)
- Returns: User metrics (registrations, active, applications)
- API Call: `GET /api/analytics/users` (if exists)

**`get_resource_analytics`**
- Purpose: Resource usage statistics
- Parameters: `dateRange` (object)
- Returns: Download counts, popular resources
- API Call: `GET /api/analytics/resources` (if exists)

**`get_rating_analytics`**
- Purpose: Rating statistics
- Parameters: `entityType` (enum)
- Returns: Average ratings, distribution
- API Call: `GET /api/analytics/ratings` (if exists)

**`generate_usage_report`**
- Purpose: Generate comprehensive usage report
- Parameters: `dateRange` (object), `format` (enum): json, csv
- Returns: Report data
- API Call: `GET /api/analytics/report` (if exists)

---

## MCP Resources


### Schema Resources

**`database_schema`**
- URI: `schema://database`
- Description: Current database schema
- Format: JSON schema definitions
- Implementation: Parse `src/server/db/schema.ts`, return as JSON

**`mcp_tools_documentation`**
- URI: `docs://tools`
- Description: All MCP tools with parameters
- Format: Structured documentation
- Implementation: Generate from tool registrations

**`api_endpoints`**
- URI: `docs://api`
- Description: Available Elysia API endpoints
- Format: OpenAPI-like spec
- Implementation: Parse Elysia routes, generate spec

---

## MCP Prompts

### Analysis Prompts

**`analyze_scholarship_fit`**
- Description: Analyze student profile against scholarship requirements
- Arguments:
  - `studentProfile` (object): Student's academic info
  - `scholarshipId` (string): Target scholarship
- Returns: Fit analysis with strengths, gaps, recommendations
- Implementation: Use `get_scholarship_by_id` tool, compare with profile data

**`compare_scholarships`**
- Description: Compare multiple scholarships
- Arguments:
  - `scholarshipIds` (array): Scholarships to compare
  - `criteria` (array): Comparison factors
- Returns: Comparison table with ratings
- Implementation: Fetch all scholarships, generate comparison

**`analyze_university_ranking`**
- Description: Analyze universities by criteria
- Arguments:
  - `universityIds` (array)
  - `criteria` (array): academics, location, cost, ratings
- Returns: Ranking analysis
- Implementation: Fetch universities, ratings, analyze

### Content Generation Prompts

**`generate_scholarship_description`**
- Description: Create compelling scholarship description
- Arguments:
  - `scholarshipName` (string)
  - `providerName` (string)
  - `keyFeatures` (array)
  - `targetAudience` (string)
- Returns: Draft description
- Implementation: Use context from other scholarships, generate description

**`generate_event_description`**
- Description: Create event description
- Arguments: eventType, name, date, details
- Returns: Formatted event description
- Implementation: Use template with event details

**`generate_resource_summary`**
- Description: Summarize resource content
- Arguments: `resourceId` (string)
- Returns: Summary with key points
- Implementation: Fetch resource metadata, generate summary

### Data Quality Prompts

**`validate_dataset_quality`**
- Description: Assess data quality
- Arguments:
  - `entityType` (enum)
  - `sampleSize` (number)
- Returns: Quality report with issues and suggestions
- Implementation: Use `validate_data_integrity` tool, analyze results

**`suggest_data_improvements`**
- Description: Suggest improvements for dataset
- Arguments:
  - `entityType` (enum)
  - `issues` (array): Known issues
- Returns: Improvement recommendations
- Implementation: Analyze issues, generate suggestions

---

## Permission System

### Tool Permission Mapping

| Tool                                              | Required Permission          |
| ------------------------------------------------- | ---------------------------- |
| `fetch_*`                                         | `resource:read`              |
| `create_*`, `bulk_create_*`                       | `resource:write`             |
| `update_*`, `bulk_update_*`                       | `resource:write`             |
| `delete_*`, `bulk_delete_*`                       | `resource:delete`            |
| `bulk_import_data`                                | `resource:write`             |
| `bulk_update_data`                                | `resource:write`             |
| `cleanup_orphans`                                 | `admin:write`                |
| `fetch_users`, `update_user`, `bulk_update_users` | `users:read` / `users:write` |
| `validate_data_integrity`                         | `admin:read`                 |
| `*_export`                                        | `resource:read`              |
| `analytics:*`                                     | `analytics:read`             |

### Resource Types

- `scholarships` - Scholarship data
- `universities` - University and college data
- `resources` - Resource library
- `ratings` - Rating system
- `resumes` - Resume builder
- `recommendations` - Recommendation letters
- `users` - User data
- `analytics` - Analytics and reports
- `admin` - Admin operations

---

## Implementation Priority

### Phase 1: Core Data Management (Week 1)
- ✅ Scholarship tools (complete set with bulk operations)
- ⏳ University tools (fetch, create, update, delete + bulk variants)
- ⏳ Resource tools (basic CRUD + bulk variants)
- ⏳ Taxonomy tools (countries, degrees, fields + bulk variants)

### Phase 2: Academic Content (Week 2)
- Academic program and course tools
- College and department tools
- Rating system tools
- All with bulk operation support

### Phase 3: User Data (Week 3)
- Resume builder tools
- Recommendation letter tools
- GPA converter tools
- User and application tools
- All with bulk operation support

### Phase 4: Advanced Features (Week 4)
- Data validation tools
- Bulk import/export
- Analytics tools
- Resources implementation

### Phase 5: Prompts (Week 5)
- Analysis prompts
- Content generation prompts
- Data quality prompts

---

## File Structure

```
src/server/mcp/
├── server.ts                      # MCP server instance (existing)
├── utils.ts                       # Utility functions (existing)
├── tools/
│   ├── scholarships.ts             # Scholarship tools (existing, add bulk ops)
│   ├── universities.ts             # University tools
│   ├── academic.ts                # Programs and courses
│   ├── ratings.ts                 # Rating system
│   ├── resources.ts               # Resource library
│   ├── resumes.ts                 # Resume builder
│   ├── recommendations.ts          # Recommendation letters
│   ├── gpa.ts                    # GPA converter
│   ├── taxonomy.ts                # Taxonomy management
│   ├── users.ts                   # User and applications
│   ├── validation.ts              # Data validation
│   └── analytics.ts               # Analytics and reporting
├── resources/
│   ├── schema.ts                  # Schema resources
│   └── docs.ts                   # Documentation resources
└── prompts/
    ├── analysis.ts                # Analysis prompts
    ├── generation.ts              # Content generation
    └── quality.ts                # Data quality prompts
```
a

---

## Testing Strategy

### Unit Testing
- Each tool function tested independently
- Input validation with Zod
- Error handling scenarios
- Permission checks
- Bulk operation logic

### Integration Testing
- MCP server endpoint connectivity
- API key authentication
- Eden API client calls
- Database operations (via API)

### E2E Testing
- HTTPStreaming transport with Claude, Opencode
- Bulk operations (create, update, delete)
- Multi-tool workflows
- Error recovery

---

## Success Metrics

- Tool coverage: 95% of database entities
- Average response time: < 500ms
- Success rate: > 99%
- Zero security incidents
- Developer adoption rate: > 80% (measured by API key creation)
- Bulk operation efficiency: Reduce AI agent tokens by 50%+

---

## Next Steps

1. **Review and Approve** - Validate this plan with team
2. **Create Implementation Tasks** - Break down into detailed subtasks
3. **Phase 1 Implementation** - Start with scholarship and university tools (add bulk operations to existing scholarships.ts)
4. **Documentation Updates** - Keep docs/mcp-server.md in sync
5. **Testing** - Test each tool as implemented
6. **Iteration** - Add tools based on usage feedback

---

## Notes

- **✅ All tools MUST use Eden API client** from `@/server/elysia/eden.ts`
- **❌ NEVER access database directly** in MCP tools
- **✅ Infer types from Eden API** for type safety (see scholarships.ts pattern)
- **❌ TRY not to use any type annotations**
- **✅ New Drizzle Query Syntax** - check the docs at @docs/drizzle-v1-changes.md, @docs/drizzle-queries.md
- **✅ Handle bulk operations internally** - abstract looping from AI agents
- **✅ Follow `scholarships.ts` pattern** for type inference, API calls, responses
- **✅ Use consistent error handling** and response formatting
- **✅ Use utilities from `utils.ts`** (formatDate, truncateText, etc.)
- **✅ HTTPStreaming is default transport** - NOT SSE
- **✅ Use `requestContext.authInfo.token`** for authentication in tools (propagated from user request)
- **✅ Return structured bulk operation results** with summary statistics
- **✅ Chain API calls directly** - e.g., `api.api.domain({ id }).subresource.method()` for correct path generation.
