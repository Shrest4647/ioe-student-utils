### Phase 4: Split-View Resume Editor (Week 2, Days 3-5)

**Goal**: Build the main editor with live preview

#### Task 4.1: Editor Layout Component

**File**: `src/components/resume-builder/editor/resume-editor.tsx`
**Complexity**: Moderate
**Dependencies**: Task 3.3

**Steps**:

1. Create two-column layout (60% editor, 40% preview)
2. Use CSS Grid or Flexbox
3. Make responsive (stack on mobile)
4. Add sticky preview panel
5. Add toggle for fullscreen preview

**Layout Structure**:

```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">{/* Editor Panel */}</div>
  <div className="lg:col-span-2">{/* Preview Panel - sticky */}</div>
</div>
```

#### Task 4.2: Section Navigation Sidebar

**File**: `src/components/resume-builder/editor/section-nav.tsx`
**Complexity**: Moderate
**Dependencies**: None

**Steps**:

1. Create vertical sidebar with all sections
2. Sections: Personal Info, Work Experience, Education, Language Skills, Other Skills
3. Use accordion pattern for collapsible sections
4. Show completion status (✓ for completed, ○ for empty)
5. Highlight active section
6. Click to jump to section

**Reference Pattern**: Use Shadcn Accordion component

#### Task 4.3: Resume Preview Component

**File**: `src/components/resume-builder/preview/resume-preview.tsx`
**Complexity**: Complex
**Dependencies**: None

**Steps**:

1. Create A4-sized preview container (210mm width)
2. Apply Europass styling:
   - Primary color: `#004494` (EC Blue)
   - Font: Arial, 11-12pt
   - Single-column layout
3. Render sections in order:
   - Header with name and contact
   - Photo (right-aligned, if exists)
   - Work Experience (reverse chronological)
   - Education (reverse chronological)
   - Skills (categorized)
4. Use CSS print media queries for proper printing
5. Add "Download PDF" button
6. Make updates reactive (use props)

**Europass CSS**:

```css
.resume-preview {
  font-family: Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.4;
  color: #404040;
}

.resume-header {
  background-color: #004494;
  color: white;
  padding: 20px;
}

.section-title {
  background-color: #004494;
  color: white;
  padding: 8px 12px;
  margin-top: 16px;
}
```

#### Task 4.4: Real-time Preview Updates

**File**: Update `resume-editor.tsx`
**Complexity**: Moderate
**Dependencies**: Task 4.1, 4.3

**Steps**:

1. Lift state to editor component
2. Pass resume data to preview as props
3. Use `useEffect` to fetch initial data
4. Update preview on form changes
5. Add debouncing (500ms) to prevent excessive re-renders
6. Show "Saving..." indicator during API calls
