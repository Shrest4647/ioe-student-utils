### Phase 3: Profile Creation Wizard (Week 2, Days 1-2)

**Goal**: Create step-by-step profile creation flow

#### Task 3.1: Profile Creation Page Layout

**File**: `src/app/(protected)/dashboard/resume-builder/profile/page.tsx`
**Complexity**: Simple
**Dependencies**: Task 2.1

**Steps**:

1. Create page component with client-side rendering
2. Import layout components from existing dashboard pages
3. Use fade-in animation (line 87 in resources/page.tsx)
4. Create breadcrumb navigation
5. Add progress indicator (1. Personal Info → 2. Work Experience → 3. Education → 4. Skills)

**Reference Pattern**: Follow `resources/page.tsx` layout structure

#### Task 3.2: Stepper Component

**File**: `src/components/resume-builder/shared/stepper.tsx`
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. Create stepper component props: `steps`, `currentStep`, `onStepChange`
2. Display horizontal stepper with numbered circles
3. Show completion status for each step
4. Make clickable for navigation between steps
5. Use existing Shadcn styling

#### Task 3.3: Profile Creation Container

**File**: `src/components/resume-builder/editor/profile-wizard.tsx`
**Complexity**: Moderate
**Dependencies**: Tasks 2.2-2.6, 3.2

**Steps**:

1. Manage current step state with `useState`
2. Import all section forms (personal-info, work-experience, etc.)
3. Display current step's form
4. Add Previous/Next navigation buttons
5. Validate current step before allowing next
6. Save data after each step (auto-save)
7. Show completion message on final step
8. Redirect to resume creation after completion

#### Task 3.4: Detailed Instructions Panel

**File**: `src/components/resume-builder/shared/instructions-panel.tsx`
**Complexity**: Simple
**Dependencies**: None

**Steps**:

1. Create collapsible side panel with instructions
2. Show step-specific guidance:
   - What information to include
   - Tips from Europass guidelines
   - Examples of good content
3. Use accordion/collapsible pattern from Shadcn
4. Add "Hide/Show Instructions" toggle
