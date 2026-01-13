### Phase 5: Resume Creation & Management (Week 3, Days 1-2)

**Goal**: Allow users to create and manage multiple resumes

#### Task 5.1: Resume Creation Page

**File**: `src/app/(protected)/dashboard/resume-builder/create/page.tsx`
**Complexity**: Simple
**Dependencies**: Task 3.3

**Steps**:

1. Check if user has profile (redirect to /profile if not)
2. Show "Create New Resume" form:
   - Resume name input
   - Section selection (checkboxes for all available sections)
   - Template selection (start with Europass only)
3. Create resume button calls API endpoint
4. Redirect to editor after creation

#### Task 5.2: Section Selection Component

**File**: `src/components/resume-builder/shared/section-selector.tsx`
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. List all available sections with descriptions
2. Use checkboxes for selection
3. Group sections:
   - **Required**: Personal Info (always checked, disabled)
   - **Core**: Work Experience, Education
   - **Skills**: Language Skills, Other Skills
   - **Optional**: About Me, Projects, Certificates, etc.
4. Show "Select All" / "Deselect All" buttons

#### Task 5.3: My Resumes Dashboard

**File**: `src/app/(protected)/dashboard/resume-builder/my-resumes/page.tsx`
**Complexity**: Simple
**Dependencies**: Task 5.1

**Steps**:

1. Fetch user's resumes using `apiClient.api.resumes["my-resumes"].get()`
2. Display in card grid or table
3. Each resume card shows:
   - Resume name
   - Created date
   - Last modified date
   - Preview thumbnail
   - Actions: Edit, Duplicate, Delete, Download PDF
4. Add "Create New Resume" button

**Reference Pattern**: Follow `resources/page.tsx` table pattern

#### Task 5.4: Edit Resume Page

**File**: `src/app/(protected)/dashboard/resume-builder/edit/[id]/page.tsx`
**Complexity**: Simple
**Dependencies**: Task 4.4

**Steps**:

1. Get resume ID from URL params
2. Fetch resume data on mount
3. Load `resume-editor.tsx` with resume data
4. Update breadcrumb with resume name
5. Add back button to "My Resumes"
