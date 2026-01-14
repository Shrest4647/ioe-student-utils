### Phase 7: Polish & Advanced Features (Week 4)

**Goal**: Add advanced functionality and UX improvements

#### Task 7.1: Drag-and-Drop Reordering

**File**: `src/components/resume-builder/editor/draggable-sections.tsx`
**Complexity**: Complex
**Dependencies**: Task 4.2

**Steps**:

1. Install: `npm install @dnd-kit/core @dnd-kit/sortable`
2. Wrap section items with draggable components
3. Allow reordering of:
   - Work experiences
   - Education records
   - Skill categories
4. Save new order to database
5. Update preview in real-time

#### Task 7.2: Rich Text Editor for Descriptions

**File**: `src/components/resume-builder/shared/rich-text-editor.tsx`
**Complexity**: Moderate
**Dependencies**: None

**Steps**:

1. Install: `npm install @tiptap/react @tiptap/starter-kit`
2. Create Tiptap editor component
3. Toolbar with: Bold, Italic, Lists, Bullet points
4. Limit to basic formatting (keep Europass clean)
5. Add character counter (recommend 200-300 words)
6. Save as HTML or Markdown to database

#### Task 7.3: Auto-Save Functionality

**File**: Update all form components
**Complexity**: Moderate
**Dependencies**: All previous tasks

**Steps**:

1. Implement debounced auto-save (5-10 seconds after change)
2. Show "Saving..." indicator
3. Show "Saved" checkmark on success
4. Handle conflicts (if multiple tabs open)
5. Save last saved timestamp

**Implementation Pattern**:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (hasChanges) {
      saveData();
    }
  }, 5000);
  return () => clearTimeout(timer);
}, [formData, hasChanges]);
```

#### Task 7.4: Resume Duplication

**File**: Update API and UI
**Complexity**: Simple
**Dependencies**: Task 5.3

**Steps**:

1. Add API endpoint: `POST /api/resumes/:id/duplicate`
2. Copy resume with all customizations
3. Add "Duplicate" button in My Resumes dashboard
4. Name new resume: "{Original Name} (Copy)"

#### Task 7.5: Validation & Error Handling

**Files**: All form components
**Complexity**: Moderate
**Dependencies**: All form tasks

**Steps**:

1. Add field-level validation:
   - Required fields (marked with red asterisk)
   - Email format validation
   - Phone number format
   - Date validation (end date after start date)
2. Show inline error messages
3. Disable save button until form is valid
4. Show summary of errors before allowing PDF download
5. Add "Completeness" score (e.g., "75% complete")

#### Task 7.6: Accessibility Improvements

**Files**: All components
**Complexity**: Simple
**Dependencies**: All UI tasks

**Steps**:

1. Ensure all forms are keyboard navigable
2. Add ARIA labels to all inputs
3. Add proper focus management
4. Support screen readers
5. Test with keyboard-only navigation
6. Add skip-to-content links
7. Ensure color contrast meets WCAG AA

#### Task 7.7: Loading States & Skeletons

**Files**: All page components
**Complexity**: Simple
**Dependencies**: All data-fetching tasks

**Steps**:

1. Add skeleton screens during data fetch
2. Use Shadcn `Skeleton` component
3. Show loading spinners for actions
4. Add optimistic updates for immediate feedback
5. Handle error states gracefully

**Reference Pattern**: `DASHBOARD_SKELETON_KEYS` in resources/page.tsx (line 29)

#### Task 7.8: Responsive Design Optimization

**Files**: All layout components
**Complexity**: Moderate
**Dependencies**: All UI tasks

**Steps**:

1. Test on mobile (320px - 768px)
2. Stack editor/preview vertically on mobile
3. Add tab switcher for mobile (Edit / Preview)
4. Ensure touch targets are 44px minimum
5. Test on tablet (768px - 1024px)
6. Optimize font sizes for readability
7. Ensure PDF preview is readable on small screens
