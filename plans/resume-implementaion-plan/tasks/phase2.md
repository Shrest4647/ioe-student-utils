Core UI Components (Week 1, Days 4-5)

**Goal**: Build reusable form components for resume sections

#### Task 2.1: Create Base Resume Components Directory

**Directory**: `src/components/resume-builder/`
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. Create directory structure:
   ```
   src/components/resume-builder/
   ├── forms/
   ├── editor/
   ├── templates/
   └── shared/
   ```

#### Task 2.2: Personal Information Form

**File**: `src/components/resume-builder/forms/personal-info-form.tsx`
**Complexity**: Simple
**Dependencies**: Task 2.1

**Steps**:

1. Create client component: `"use client"`
2. Import Shadcn components: `Button`, `Input`, `Label`, `Card`
3. Import from existing: `apiClient` from `@/lib/eden`
4. Create form with fields:
   - First Name, Last Name (required)
   - Email, Phone
   - Address fields (street, city, postal code, country)
   - Nationality, Date of Birth
   - Photo upload (use existing S3 pattern from resources)
5. Add form validation using TanStack React Form
6. Add save button that calls `apiClient.api.resumes.profile.post()`
7. Show success/error toasts using `sonner` (line 5 in resources/page.tsx)

**Reference Pattern**: Follow `upload-resource-modal.tsx` structure

#### Task 2.3: Work Experience Form

**File**: `src/components/resume-builder/forms/work-experience-form.tsx`
**Complexity**: Moderate
**Dependencies**: Task 2.2

**Steps**:

1. Create form with fields:
   - Job Title, Employer (required)
   - Start Date, End Date (date picker from Shadcn)
   - "I currently work here" checkbox
   - City, Country
   - Description (textarea with rich text support)
2. Add "Add Experience" button
3. Implement list view of existing experiences with Edit/Delete buttons
4. Use `useCallback` for data fetching (line 45 in resources/page.tsx)
5. Sort experiences by date (most recent first)

**Reference Pattern**: Follow table pattern in `resources/page.tsx` (lines 143-174)

#### Task 2.4: Education Form

**File**: `src/components/resume-builder/forms/education-form.tsx`
**Complexity**: Moderate
**Dependencies**: Task 2.2

**Steps**:

1. Similar to work experience form
2. Fields: Qualification, Institution, Start/End dates, Description
3. Add main subjects/thesis title field
4. Implement add/edit/delete functionality

#### Task 2.5: Language Skills Form

**File**: `src/components/resume-builder/forms/language-skills-form.tsx`
**Complexity**: Moderate
**Dependencies**: Task 2.2

**Steps**:

1. Language dropdown (autocomplete from existing languages)
2. CEFR level selectors:
   - Listening (A1-C2)
   - Reading (A1-C2)
   - Spoken Interaction (A1-C2)
   - Spoken Production (A1-C2)
   - Writing (A1-C2)
3. Use radio buttons or select dropdown for CEFR levels
4. Display as table after adding (like Europass)

#### Task 2.6: Other Skills Form

**File**: `src/components/resume-builder/forms/skills-form.tsx`
**Complexity**: Moderate
**Dependencies**: Task 2.2

**Steps**:

1. Category selector: Digital, Communication, Organizational, Job-related, Computer/IT
2. Tag input for skills (array of strings)
3. Proficiency level selector
4. Description field
5. Display as categorized cards
