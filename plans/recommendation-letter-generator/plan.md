# Recommendation Letter Generator - Implementation Plan

## Overview
Build a robust web application to generate professional letters of recommendation for IOE graduate students applying to international and national institutions. The system will provide a gallery of templates, smart pre-filling from user profiles, and a wizard-based interface to create customized letters with minimal effort.

## Project Goals
1. Eliminate the need to start from scratch when creating LoRs
2. Pre-load known data from user profiles to minimize manual input
3. Provide extensible template library for different use cases
4. Enable export to PDF and Google Docs
5. Save and manage generated letters for future access
6. Keep user agency - allow editing at every step

## Technical Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4 with OKLCH color system
- **UI Components**: Shadcn/ui + Radix UI + custom components
- **Forms**: @tanstack/react-form with Zod validation
- **Backend**: Elysia.js API framework
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth
- **Storage**: AWS S3 for PDF storage
- **PDF Generation**: jsPDF or react-pdf (server-side)
- **Google Docs Integration**: Google Docs API (optional, Phase 2)

---

## Phase 1: Database Schema & Backend Foundation

### 1.1 Database Schema Design

#### New Tables to Create

**`recommendation_template`**
- Stores reusable letter templates with variable placeholders
- Fields:
  - `id: text` (UUID, primary key)
  - `name: text` (template name, e.g., "Research-Focused PhD LoR")
  - `description: text` (what this template is best for)
  - `category: text` (enum: "research", "academic", "industry", "general", "country-specific")
  - `content: text` (template content with placeholders like `{{student_name}}`)
  - `variables: jsonb` (array of required variables with metadata)
  - `targetProgramType: text` (enum: "phd", "masters", "job", "funding")
  - `targetRegion: text` (enum: "us", "uk", "eu", "asia", "global", null)
  - `isSystemTemplate: boolean` (default: true, system vs user-created)
  - `isActive: boolean` (default: true)
  - `createdById: text` (FK to user.id, nullable for system templates)
  - `updatedById: text` (FK to user.id, nullable)
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

**`recommendation_letter`**
- Stores generated letters and their metadata
- Fields:
  - `id: text` (UUID, primary key)
  - `title: text` (user-friendly name for the letter)
  - `studentId: text` (FK to user.id, who created it)
  - `templateId: text` (FK to recommendation_template.id)
  - `recommenderName: text` (professor/recommender name)
  - `recommenderTitle: text` (e.g., "Professor of Computer Science")
  - `recommenderInstitution: text` (institution name)
  - `recommenderEmail: text` (optional)
  - `recommenderDepartment: text` (optional)
  - `targetInstitution: text` (where the letter is being sent)
  - `targetProgram: text` (program name)
  - `targetDepartment: text` (optional)
  - `purpose: text` (admission, scholarship, job, etc.)
  - `relationship: text` (how the student knows the recommender)
  - `contextOfMeeting: text` (optional - courses, research, etc.)
  - `studentAchievements: text` (key achievements to highlight)
  - `researchExperience: text` (research projects and experience)
  - `academicPerformance: text` (class performance, grades, etc.)
  - `personalQualities: text` (leadership, teamwork, etc.)
  - `customContent: text` (additional custom content)
  - `finalContent: text` (generated letter content)
  - `pdfUrl: text` (S3 URL for generated PDF)
  - `googleDocUrl: text` (optional, Google Docs link)
  - `status: text` (enum: "draft", "completed", "exported")
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

**`student_profile_data`**
- Extended profile data for smart pre-filling
- Fields:
  - `id: text` (UUID, primary key)
  - `userId: text` (FK to user.id, unique)
  - `gpa: text` (e.g., "3.8/4.0")
  - `major: text`
  - `minor: text` (optional)
  - `expectedGraduation: text` (e.g., "May 2025")
  - `researchInterests: text` (array or comma-separated)
  - `skills: text` (array or comma-separated)
  - `achievements: text` (awards, honors, etc.)
  - `projects: text` (research or academic projects)
  - `workExperience: text` (relevant work experience)
  - `extracurricular: text` (clubs, organizations, etc.)
  - `careerGoals: text` (short-term and long-term goals)
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

#### Indexes to Add
- Index on `recommendation_letter.studentId` for user's letters
- Index on `recommendation_letter.status` for filtering
- Index on `recommendation_template.category` for browsing
- Index on `recommendation_template.isActive` for filtering active templates
- Composite index on `recommendation_template.(category, targetProgramType, targetRegion)`

### 1.2 Database Migration Tasks
- [ ] Write Drizzle migration for new tables
- [ ] Create indexes for performance
- [ ] Set up foreign key constraints
- [ ] Add seed data for initial system templates (5-10 templates)
- [ ] Test migration in development environment
- [ ] Document schema changes

---

## Phase 2: Backend API Development

### 2.1 API Endpoints to Create

#### Template Management

**`GET /api/recommendation-templates`**
- Query params: `category`, `targetProgramType`, `targetRegion`, `isActive`
- Returns: List of templates matching filters
- Auth: Not required (public browsing)
- Validation: Zod schema for query params

**`GET /api/recommendation-templates/:id`**
- Returns: Single template with details
- Auth: Not required
- Validation: UUID validation for id

**`POST /api/recommendation-templates`**
- Body: Template data
- Returns: Created template
- Auth: Required, admin only (in future)
- Validation: Full template schema validation

**`PUT /api/recommendation-templates/:id`**
- Body: Updated template data
- Returns: Updated template
- Auth: Required, admin or creator
- Validation: Full template schema validation

**`DELETE /api/recommendation-templates/:id`**
- Returns: Success message
- Auth: Required, admin or creator
- Validation: UUID validation

#### Letter Management

**`GET /api/recommendation-letters`**
- Query params: `status`, `templateId`, `page`, `limit`
- Returns: Paginated list of user's letters
- Auth: Required
- Authorization: user can only see their own letters

**`GET /api/recommendation-letters/:id`**
- Returns: Single letter with all details
- Auth: Required
- Authorization: user can only access their own letters

**`POST /api/recommendation-letters`**
- Body: Letter metadata and form data
- Returns: Created letter with generated content
- Auth: Required
- Process:
  1. Validate input data
  2. Load selected template
  3. Replace variables in template with user data
  4. Load user profile data for smart pre-filling
  5. Generate initial content
  6. Save to database
  7. Return letter data

**`PUT /api/recommendation-letters/:id`**
- Body: Updated letter data
- Returns: Updated letter
- Auth: Required
- Authorization: user can only update their own letters
- Process:
  1. Validate input
  2. Update database
  3. If status changes to "completed", regenerate PDF

**`DELETE /api/recommendation-letters/:id`**
- Returns: Success message
- Auth: Required
- Authorization: user can only delete their own letters
- Process:
  1. Delete PDF from S3
  2. Delete database record

**`POST /api/recommendation-letters/:id/generate-pdf`**
- Returns: PDF URL
- Auth: Required
- Authorization: user can only generate their own letters
- Process:
  1. Get letter data
  2. Render HTML from template
  3. Generate PDF using jsPDF or puppeteer
  4. Upload to S3
  5. Update letter record with PDF URL
  6. Return URL

**`POST /api/recommendation-letters/:id/export-to-google-docs`**
- Returns: Google Doc URL
- Auth: Required
- Authorization: user can only export their own letters
- Process:
  1. Get letter data
  2. Use Google Docs API to create document
  3. Populate with content
  4. Update letter record with Google Doc URL
  5. Return URL
- Note: Phase 2 feature, optional

#### Student Profile Data

**`GET /api/student-profile`**
- Returns: Current user's extended profile data
- Auth: Required

**`PUT /api/student-profile`**
- Body: Updated profile data
- Returns: Updated profile
- Auth: Required
- Validation: Profile schema validation

### 2.2 API Development Tasks
- [ ] Set up Elysia route handlers in `/server/elysia/routes/recommendations.ts`
- [ ] Create Zod validation schemas for all endpoints
- [ ] Implement authorization middleware (user can only access their own data)
- [ ] Create template variable replacement utility
- [ ] Implement PDF generation service
- [ ] Add S3 upload utility for PDFs
- [ ] Set up error handling and logging
- [ ] Add API rate limiting
- [ ] Write unit tests for API endpoints
- [ ] Document API endpoints with OpenAPI/Swagger

---

## Phase 3: Template System

### 3.1 Template Variable System

#### Variable Types
- **Simple Variables**: `{{student_name}}`, `{{recommender_name}}`
- **Conditional Variables**: `{{#if student_gpa}}GPA: {{student_gpa}}{{/if}}`
- **List Variables**: `{{#each research_projects}}- {{name}}{{/each}}`
- **Optional Variables**: Only show if data exists

#### Variable Metadata Structure
```typescript
{
  name: "student_name",
  label: "Student Name",
  type: "text",
  required: true,
  defaultValue: "{{user.name}}",
  description: "Full name of the student"
}
```

#### Built-in Variables (Auto-loaded)
- `{{user.name}}` - User's name
- `{{user.email}}` - User's email
- `{{current_date}}` - Current date
- `{{current_year}}` - Current year
- Any data from `student_profile_data` table

### 3.2 Template Categories

1. **Research-Focused**
   - For PhD applications
   - Emphasizes research experience, publications, potential
   - Target: Academic/research positions

2. **Academic/Teaching-Focused**
   - For Master's programs
   - Emphasizes coursework, academic performance
   - Target: Graduate school admission

3. **Industry-Focused**
   - For job applications
   - Emphasizes practical skills, projects, work experience
   - Target: Industry positions

4. **General-Purpose**
   - Balanced template
   - Can be used for multiple purposes
   - Target: Any application

5. **Country-Specific**
   - US-style (formal, detailed)
   - UK-style (concise, reference-focused)
   - Europe-style (structured, specific format)

### 3.3 Template Development Tasks
- [ ] Design 5-10 initial system templates
- [ ] Create template variable replacement engine
- [ ] Implement conditional rendering in templates
- [ ] Add template preview functionality
- [ ] Create template validation (required variables check)
- [ ] Document template syntax and variables
- [ ] Set up template versioning (future)

---

## Phase 4: Frontend - Wizard Interface

### 4.1 Wizard Flow (Multi-Step Form)

#### Step 1: Template Selection
- Display template gallery with cards
- Filter by category, program type, region
- Show template preview on hover/click
- Search templates by name
- Selected template highlights

#### Step 2: Recommender Information
- **Fields**:
  - Recommender name (required)
  - Title/position (required)
  - Institution (required)
  - Email (optional)
  - Department (optional)
  - Relationship to student (required, dropdown + custom)
  - How long they've known the student (optional)
  - Context of meeting (courses taught, research advisor, etc.)

#### Step 3: Target Information
- **Fields**:
  - Target institution (required)
  - Target program (required)
  - Target department (optional)
  - Country (required, dropdown)
  - Purpose (admission, scholarship, job, etc.)
  - Deadline (optional, for user reference)

#### Step 4: Student Information (Pre-filled)
- **Fields** (auto-loaded from profile, editable):
  - Academic achievements (pre-fill from profile)
  - Research experience (pre-fill from profile)
  - Academic performance (GPA, courses, etc.)
  - Personal qualities (leadership, teamwork, etc.)
  - Skills and competencies (pre-fill from profile)
  - Career goals (pre-fill from profile)
- User can edit all fields
- Show which fields are auto-loaded

#### Step 5: Custom Content
- **Fields**:
  - Additional achievements not covered
  - Specific stories or anecdotes
  - Strengths to emphasize
  - Areas for growth (optional)
  - Any other custom content

#### Step 6: Review and Edit
- Show generated letter preview
- Allow inline editing of content
- Show all filled variables
- Allow back navigation to any step
- "Regenerate" button to recreate from template
- Save as draft or complete

### 4.2 UI Components to Create

**TemplateGallery Component**
- Grid of template cards
- Filter sidebar
- Search bar
- Preview modal
- Selection state

**Wizard Component**
- Progress indicator (steps 1-6)
- Navigation buttons (Back, Next, Save Draft)
- Step validation
- Auto-save draft functionality
- Smooth animations between steps

**LetterPreview Component**
- Rich text editor for content
- Side-by-side view (editor + preview)
- Print-friendly view
- Download PDF button
- Export to Google Docs button (Phase 2)

**LetterCard Component**
- Display in user's letter library
- Show key metadata (title, date, status)
- Quick actions (edit, delete, download)
- Status badges (draft, completed, exported)

**UserProfileData Component**
- Form to manage extended profile data
- Tabs for different sections
- Auto-save functionality
- Clear/save buttons

### 4.3 Frontend Development Tasks
- [ ] Set up routes: `/dashboard/recommendations`, `/dashboard/recommendations/new`, `/dashboard/recommendations/[id]`
- [ ] Create TemplateGallery component
- [ ] Create Wizard component with all 6 steps
- [ ] Implement form validation using TanStack Form
- [ ] Create LetterPreview component with rich text editor
- [ ] Implement auto-save draft functionality
- [ ] Add progress indicator
- [ ] Create LetterList component for user's library
- [ ] Add filtering and sorting to letter list
- [ ] Implement PDF download functionality
- [ ] Add loading states and error handling
- [ ] Make responsive design (mobile, tablet, desktop)
- [ ] Add animations with Framer Motion
- [ ] Add toast notifications for actions
- [ ] Write component tests

---

## Phase 5: PDF Generation

### 5.1 PDF Generation Options

#### Option A: Client-Side with jsPDF
- Pros: Fast, no server load
- Cons: Limited styling, may not look professional

#### Option B: Server-Side with Puppeteer
- Pros: Perfect styling, professional output
- Cons: Slower, requires server resources

#### Option C: React-PDF (Server-Side)
- Pros: React components, consistent with frontend
- Cons: Learning curve

**Recommended**: Option B (Puppeteer) for professional quality

### 5.2 PDF Generation Process
1. Create HTML template from letter content
2. Add professional styling (header, footer, fonts)
3. Use Puppeteer to render HTML to PDF
4. Upload to S3
5. Return URL to frontend

### 5.3 PDF Development Tasks
- [ ] Choose PDF generation library
- [ ] Create HTML template for PDF
- [ ] Add professional styling (fonts, spacing, headers)
- [ ] Implement server-side PDF generation endpoint
- [ ] Add S3 upload functionality
- [ ] Handle PDF generation errors gracefully
- [ ] Add progress indicator for long-running generations
- [ ] Test PDF generation with various content lengths
- [ ] Optimize for A4 paper size
- [ ] Add page numbers and headers/footers

---

## Phase 6: Google Docs Integration (Optional)

### 6.1 Google Docs API Integration
- Use Google Docs API to create documents
- Authenticate with OAuth 2.0
- Populate document with letter content
- Maintain formatting
- Return edit URL to user

### 6.2 Google Docs Tasks
- [ ] Set up Google Cloud project
- [ ] Enable Google Docs API
- [ ] Implement OAuth 2.0 flow
- [ ] Create API endpoint for Google Docs export
- [ ] Handle authentication errors
- [ ] Test export with various content
- [ ] Document setup process for users

---

## Phase 7: Testing & Deployment

### 7.1 Testing Tasks
- [ ] Unit tests for all API endpoints
- [ ] Unit tests for utility functions
- [ ] Integration tests for wizard flow
- [ ] E2E tests for complete user journey
- [ ] Test PDF generation with various templates
- [ ] Test with real user data
- [ ] Performance testing (PDF generation time)
- [ ] Security testing (SQL injection, XSS)
- [ ] Accessibility testing (WCAG compliance)
- [ ] Browser compatibility testing

### 7.2 Deployment Tasks
- [ ] Set up staging environment
- [ ] Run database migrations in staging
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Test all functionality in staging
- [ ] Create deployment documentation
- [ ] Train users on new feature
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Create rollback plan

---

## Phase 8: Documentation & User Guide

### 8.1 Documentation Tasks
- [ ] Write API documentation
- [ ] Create user guide with screenshots
- [ ] Create video tutorial (optional)
- [ ] Document template creation process
- [ ] Write FAQ section
- [ ] Create troubleshooting guide
- [ ] Document Google Docs setup (if applicable)

---

## Implementation Order

### Sprint 1: Foundation
1. Database schema and migrations
2. Basic API endpoints (CRUD for templates and letters)
3. Seed data for templates

### Sprint 2: Core Features
1. Template variable replacement system
2. Wizard UI - Steps 1-3
3. Letter preview component
4. Basic PDF generation

### Sprint 3: Advanced Features
1. Wizard UI - Steps 4-6
2. Student profile data management
3. Letter library and management
4. Enhanced PDF generation

### Sprint 4: Polish & Deploy
1. Testing and bug fixes
2. Google Docs integration (optional)
3. Documentation
4. Deployment to production

---

## Success Metrics

1. **User Adoption**: % of students using the feature
2. **Time Saved**: Average time to create LoR vs manual (target: <10 minutes)
3. **Template Usage**: Most used templates
4. **Error Rate**: % of failed PDF generations
5. **User Satisfaction**: Feedback score (target: 4+/5)

---

## Risks & Mitigation

1. **Risk**: PDF generation fails for complex content
   - **Mitigation**: Add content length limits, test thoroughly

2. **Risk**: Users don't have profile data filled
   - **Mitigation**: Make profile data optional, provide defaults

3. **Risk**: Templates don't cover all use cases
   - **Mitigation**: Allow custom templates, gather feedback

4. **Risk**: Google Docs API complexity
   - **Mitigation**: Make it optional Phase 2 feature

5. **Risk**: Poor PDF quality
   - **Mitigation**: Use Puppeteer for professional output

---

## Future Enhancements

1. **AI-Powered Suggestions**: Use AI to suggest content based on profile
2. **Collaborative Editing**: Allow students to share drafts with peers
3. **Template Marketplace**: Allow users to share custom templates
4. **Bulk Generation**: Generate multiple letters at once
5. **Analytics**: Track which templates are most successful
6. **Integration**: Integrate with Common App, other platforms
7. **Multi-language**: Support for letters in other languages
8. **Version History**: Track changes to letters over time

---

## Summary

This Recommendation Letter Generator will significantly streamline the LoR creation process for IOE students by:

- Providing 5-10 professional templates out of the box
- Pre-filling data from user profiles to minimize manual input
- Offering a guided 6-step wizard for effortless letter creation
- Enabling real-time preview and editing
- Supporting PDF export (and Google Docs in Phase 2)
- Saving and managing all generated letters

The system prioritizes user agency by allowing edits at every step while still providing intelligent defaults and scaffolding to make the process as painless as possible.
