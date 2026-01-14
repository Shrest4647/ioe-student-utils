## Implementation Phases

### Phase 1: Foundation & Database Schema (Week 1, Days 1-3)

**Goal**: Set up database tables and basic API structure

#### Task 1.1: Create Database Schema

**File**: `src/server/db/schema.ts`
**Complexity**: Moderate
**Dependencies**: None

**Steps**:

1. Add new tables after existing scholarship tables (around line 400+) (keep fields nullable unless specified otherwise) (date will only include year and month)

2. Create `resumeProfiles` table with fields:
   - `id` (text, primary key)
   - `userId` (references user.id, cascade delete)
   - `firstName`, `lastName` (not null)
   - `email`, `phone`
   - `address` (JSONB)
   - `nationality`, `dateOfBirth`
   - `photoUrl` (S3 URL)
   - `summary` (text)
   - `createdAt`, `updatedAt` (timestamps)
   - `linkedIn` (URL)
   - `github` (URL)
   - `web` (URL)

3. Create `workExperiences` table:
   - `id`, `profileId` (FK)
   - `jobTitle`, `employer`
   - `startDate`, `endDate`
   - `city`, `country`
   - `description` (text)
   - `referenceLink` (URL) (eg. link to experience letter etc)

4. Create `educationRecords` table:
   - `id`, `profileId` (FK)
   - `institution`
   - `qualification` (eg. Bachelor of Science in Computer Science)
   - `degreeLevel` (eg. Diploma, Bachelor, Master, PhD, Certificate, etc)
   - `startDate`, `endDate`, `graduationDate`
   - `grade` (text), `gradeType` (GPA-4, GPA-5, GPA-10, Percentage, etc)
   - `description`, `city`, `country`
   - `referenceLink` (URL) (eg. link to transcript, degree certificate etc)

5. Projects `projectRecords` table: (optional section for users with project experience)
   - `id`, `profileId` (FK)
   - `name`, `description`
   - `startDate`, `endDate`
   - `role`
   - `referenceLink` (URL) (eg. link to project page, github, etc)

6. Create `userSkills` table:
   - `id`, `profileId` (FK)
   - `category` (programming-language, communication, technical, organizational, databases, scores, interests, and more.)
   - `skills` (JSONB array)

7. Create `languageSkills` table: (optional section for users with language skills needs like IELTS/TOFEL)
   - `id`, `profileId` (FK)
   - `language` (text)
   - `listening`, `reading`, `speaking`, `writing` (CEFR levels A1-C2)
   - `referenceLink` (URL) (eg. link to language certificate)

8. Create Positions of Responsibility at work or volunteering `positionsOfResponsibilityRecords` table: (optional section for users with leadership experience)
   - `id`, `profileId` (FK)
   - `name`, `description`
   - `startDate`, `endDate`
   - `referenceLink` (URL) (eg. link to volunteering certificate, etc)

9. Create awards and certifications `certificationsRecords` table:
   - `id`, `profileId` (FK)
   - `name`, `issuer`
   - `issueDate`
   - `credentialUrl`

10. Create References `referencesRecords` table:
    - `id`, `profileId` (FK)
    - `name`, `title`, `relation`
    - `institution` (if academic reference)
    - `email`, `phone`

11. Create `resumes` table:
    - `id`, `profileId` (FK)
    - `name` (resume name)
    - `includedSections` (JSONB array of section included with order)
    - `designTheme` (JSONB metadata for themed rendering)
    - `createdAt`, `updatedAt`

**Reference Pattern**: Follow existing `scholarships` table structure (lines 218-240)

#### Task 1.2: Generate and Run Migration

**Files**:

- `drizzle.config.ts`
- Terminal commands
  **Complexity**: Simple
  **Dependencies**: Task 1.1

**Steps**:

1. Run `npm run db:generate` to create migration file
2. Review generated migration in `drizzle/` folder
3. Run `npm run db:push` to apply schema to database
4. Verify tables exist in PostgreSQL
