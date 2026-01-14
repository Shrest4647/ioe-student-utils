# TU to GPA Converter - Implementation Plan

## Overview

Convert Tribhuvan University (TU) percentage-based grading system to US 4.0 GPA scale using WES (World Education Services) and Scholaro conversion standards. This tool will help IOE students apply to international universities by providing accurate GPA conversions recognized by admission committees.

**Status**: Planning Phase
**Priority**: High
**Estimated Complexity**: Medium-High
**Tech Stack**: Next.js 16, Elysia, PostgreSQL, Drizzle ORM, Shadcn UI

---

## Table of Contents

1. [Requirements Analysis](#1-requirements-analysis)
2. [Conversion Standards Research](#2-conversion-standards-research)
3. [Database Design](#3-database-design)
4. [API Architecture](#4-api-architecture)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Component Breakdown](#6-component-breakdown)
7. [Implementation Phases](#7-implementation-phases)
8. [File Structure](#8-file-structure)
9. [Testing Strategy](#9-testing-strategy)
10. [Success Criteria](#10-success-criteria)

---

## 1. Requirements Analysis

### 1.1 Functional Requirements

**Core Features:**

- [ ] Convert TU percentage grades (0-100%) to US 4.0 GPA scale
- [ ] Support multiple conversion standards (WES, Scholaro)
- [ ] Batch conversion for multiple courses (transcript-style)
- [ ] Calculate cumulative GPA across all courses
- [ ] Credit-weighted GPA calculations
- [ ] Export results to CSV/PDF
- [ ] Optional save functionality for authenticated users

**Input Requirements:**

- Course name (optional, for identification)
- Percentage score (0-100, TU grading scale)
- Credit hours (typically 3-6 per course in TU)

**Output Requirements:**

- Converted GPA (4.0 scale)
- Grade letter (A, B, C, etc.)
- Quality points per course
- Cumulative GPA
- Total credits
- Conversion method used

### 1.2 Non-Functional Requirements

- **Performance**: Conversion should complete in < 500ms
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsive**: Mobile-first design, works on all device sizes
- **SEO**: Meta tags, structured data for tool discovery
- **Analytics**: Track usage, conversion methods popularity
- **Internationalization**: Ready for Nepali translation support

### 1.3 User Stories

1. **As a student**, I want to convert my entire semester grades to GPA so I can include it in my application to US universities.
2. **As a student**, I want to compare WES vs Scholaro conversions so I can choose the better result for my application.
3. **As an applicant**, I want to export my converted GPA to PDF so I can attach it to my application.
4. **As a registered user**, I want to save my calculations so I can track my GPA over multiple semesters.

---

## 2. Conversion Standards Research

### 2.1 WES (World Education Services) Conversion Scale

**Standard**: Most widely used credential evaluation service

| Percentage Range | Grade | GPA | Quality Points |
| ---------------- | ----- | --- | -------------- |
| 80-100%          | A     | 4.0 | Excellent      |
| 75-79%           | A-    | 3.7 | Very Good      |
| 70-74%           | B+    | 3.3 | Good           |
| 65-69%           | B     | 3.0 | Good           |
| 60-64%           | B-    | 2.7 | Satisfactory   |
| 55-59%           | C+    | 2.3 | Satisfactory   |
| 50-54%           | C     | 2.0 | Adequate       |
| 0-49%            | F     | 0.0 | Fail           |

**Source**: WES official documentation for Nepal/TU conversions
**Usage**: Most accepted by US universities

### 2.2 Scholaro Conversion Scale

**Standard**: Alternative credential evaluation service

| Percentage Range | Grade | GPA | Quality Points |
| ---------------- | ----- | --- | -------------- |
| 90-100%          | A     | 4.0 | Excellent      |
| 85-89%           | A-    | 3.7 | Very Good      |
| 80-84%           | B+    | 3.3 | Good           |
| 75-79%           | B     | 3.0 | Good           |
| 70-74%           | B-    | 2.7 | Satisfactory   |
| 65-69%           | C+    | 2.3 | Satisfactory   |
| 60-64%           | C     | 2.0 | Adequate       |
| 0-59%            | F     | 0.0 | Fail           |

**Source**: Scholaro GPA calculator for Nepal
**Usage**: Accepted by many European universities

### 2.3 Conversion Logic

**Algorithm**:

```
For each course:
  1. Find matching percentage range in selected standard
  2. Get GPA value and grade letter for that range
  3. Calculate quality points = GPA × credits
  4. Store results

Cumulative GPA = Total Quality Points / Total Credits
```

**Edge Cases**:

- Boundary percentages: Use inclusive ranges (e.g., 80% gets 4.0 in WES)
- Decimal percentages: Standard rounding rules (round to nearest whole)
- Failed courses: Include in GPA calculation (F = 0.0)
- Incomplete grades: Exclude from calculation

---

## 3. Database Design

### 3.1 Schema Tables

#### Table 1: `gpa_conversion_standards`

Stores different conversion standards (WES, Scholaro, etc.)

```typescript
{
  id: string (uuid, primary key)
  name: string (unique, e.g., "WES", "Scholaro")
  description: string (nullable)
  isActive: boolean (default: true)
  createdById: string (foreign key to user)
  updatedById: string (foreign key to user)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes**: `name`, `isActive`

#### Table 2: `gpa_conversion_ranges`

Stores percentage to GPA mapping for each standard

```typescript
{
  id: string (uuid, primary key)
  standardId: string (foreign key to gpa_conversion_standards)
  minPercentage: string (stored as string for precision)
  maxPercentage: string
  gpaValue: string (e.g., "4.0", "3.7")
  gradeLabel: string (nullable, e.g., "A", "B+")
  sortOrder: integer (for proper ordering)
  createdById: string (foreign key to user)
  updatedById: string (foreign key to user)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes**: `standardId`, `sortOrder`
**Relationships**: Many-to-one with `gpa_conversion_standards`

#### Table 3: `gpa_conversions` (Optional for authenticated users)

Stores saved calculations for registered users

```typescript
{
  id: string (uuid, primary key)
  userId: string (foreign key to user, required)
  standardId: string (foreign key to gpa_conversion_standards)
  name: string (nullable, user-given name e.g., "Semester 1")
  cumulativeGPA: string (stored as string for precision)
  totalCredits: string
  totalQualityPoints: string
  courseCount: integer
  calculationData: json (array of course objects)
  isDeleted: boolean (default: false, soft delete)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes**: `userId`, `standardId`, `isDeleted`, `createdAt`
**Relationships**:

- Many-to-one with `user`
- Many-to-one with `gpa_conversion_standards`

### 3.2 Seed Data

**Initial Standards to Seed**:

1. WES (with 8 ranges)
2. Scholaro (with 8 ranges)

**Location**: `src/server/db/seed.ts`

---

## 4. API Architecture

### 4.1 Endpoint Design

#### GET `/api/gpa-converter/standards`

**Description**: Get all active conversion standards with their ranges

**Authentication**: Not required

**Response**:

```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string,
      description: string | null,
      ranges: [
        {
          id: string,
          minPercentage: string,
          maxPercentage: string,
          gpaValue: string,
          gradeLabel: string | null,
          sortOrder: integer
        }
      ]
    }
  ]
}
```

---

#### POST `/api/gpa-converter/calculate`

**Description**: Calculate GPA from course grades

**Authentication**: Not required

**Request Body**:

```typescript
{
  standardId: string,
  courses: [
    {
      name: string,
      percentage: string, // "0-100"
      credits: string // "0.5" increments
    }
  ]
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    courses: [
      {
        name: string,
        percentage: string,
        credits: string,
        gpa: number,
        gradeLabel: string,
        qualityPoints: number
      }
    ],
    cumulativeGPA: string, // formatted to 2 decimals
    totalCredits: string,
    totalQualityPoints: string,
    standard: {
      id: string,
      name: string,
      description: string
    }
  }
}
```

**Error Responses**:

- 400: Invalid input data
- 404: Standard not found

---

#### POST `/api/gpa-converter/save`

**Description**: Save a GPA calculation (authenticated users only)

**Authentication**: Required

**Request Body**:

```typescript
{
  standardId: string,
  name?: string, // optional user-given name
  courses: Array<Course>,
  cumulativeGPA: string,
  totalCredits: string,
  totalQualityPoints: string
}
```

**Response**:

```typescript
{
  success: true,
  data: {
    id: string
  }
}
```

**Error Responses**:

- 401: Unauthorized
- 400: Invalid data

---

#### GET `/api/gpa-converter/history`

**Description**: Get user's saved GPA calculations

**Authentication**: Required

**Response**:

```typescript
{
  success: true,
  data: [
    {
      id: string,
      name: string | null,
      cumulativeGPA: string,
      totalCredits: string,
      courseCount: number,
      standard: {
        id: string,
        name: string
      },
      calculationData: Array<Course>,
      createdAt: string
    }
  ]
}
```

---

#### DELETE `/api/gpa-converter/:id`

**Description**: Soft delete a saved calculation

**Authentication**: Required (user must own the calculation)

**Response**:

```typescript
{
  success: true,
  message: "Calculation deleted successfully"
}
```

**Error Responses**:

- 401: Unauthorized
- 403: Forbidden (not owner)
- 404: Calculation not found

### 4.2 Implementation File

**Location**: `src/server/elysia/routes/gpa-converter.ts`

**Pattern**: Follow existing routes pattern (see `resources.ts`, `scholarships.ts`)

---

## 5. Frontend Implementation

### 5.1 Page Structure

**Route**: `/gpa-converter`

**Files**:

- `src/app/gpa-converter/page.tsx` - Main page component
- `src/app/gpa-converter/layout.tsx` - Optional layout wrapper

### 5.2 Main Page Component

**Location**: `src/app/gpa-converter/page.tsx`

```typescript
"use client";

import { GPAConverterHero } from "@/components/gpa-converter/gpa-converter-hero";
import { GPAConverter } from "@/components/gpa-converter/gpa-converter";

export default function GPAConverterPage() {
  return (
    <div className="min-h-screen bg-background">
      <GPAConverterHero />
      <main className="container mx-auto px-4 py-8">
        <GPAConverter />
      </main>
    </div>
  );
}
```

### 5.3 Component Hierarchy

```
GPAConverterPage
├── GPAConverterHero
└── GPAConverter
    ├── StandardSelector (Card)
    ├── CourseList (Card)
    │   ├── CourseRow (repeated)
    │   └── AddCourseButton
    ├── CalculateButton
    ├── GPACalculatorResults (conditional)
    │   ├── SummaryCards
    │   ├── CourseBreakdownTable
    │   ├── ConversionStandardInfo
    │   └── ActionButtons
    │       ├── SaveButton (if authenticated)
    │       └── ExportButton
    └── SavedCalculationsSidebar (optional)
```

---

## 6. Component Breakdown

### 6.1 GPAConverterHero

**Location**: `src/components/gpa-converter/gpa-converter-hero.tsx`

**Purpose**: Hero section with title, description, and feature highlights

**Components**:

- Title: "TU to GPA Converter"
- Description: Convert percentage grades to US 4.0 scale
- Feature cards: Multiple Standards, Instant Results, Save & Export
- Icons: Calculator, GraduationCap
- Animation: Framer Motion fade-in

**Pattern**: Follow `components/resources/resource-hero.tsx`

---

### 6.2 GPAConverter (Main Component)

**Location**: `src/components/gpa-converter/gpa-converter.tsx`

**Purpose**: Main calculator interface with state management

**State**:

```typescript
interface State {
  courses: Course[]; // Array of course inputs
  selectedStandard: string; // UUID of selected standard
  calculationResult: CalculationResult | null; // Computed result
  standards: Standard[]; // Fetched from API
}
```

**Features**:

- Add/remove course rows
- Real-time validation
- Standard selection dropdown
- Calculate button with loading state
- Display results when available

**Libraries**:

- `@tanstack/react-form` for form management
- `@tanstack/react-query` for API calls
- `sonner` for toast notifications

---

### 6.3 GPACalculatorResults

**Location**: `src/components/gpa-converter/gpa-calculator-results.tsx`

**Purpose**: Display calculation results with export/save options

**Sections**:

1. **Summary Cards**:
   - Cumulative GPA (large, prominent)
   - Total Credits
   - Total Quality Points

2. **Course Breakdown Table**:
   - Course name
   - Percentage
   - Credits
   - GPA (with badge)
   - Grade letter (with badge)
   - Quality points

3. **Conversion Standard Info**:
   - Standard name (e.g., "WES")
   - Description

4. **Action Buttons**:
   - Save to account (if authenticated)
   - Export to CSV
   - Export to PDF (future)

---

### 6.4 SavedCalculations

**Location**: `src/components/gpa-converter/saved-calculations.tsx`

**Purpose**: Display user's saved calculations (authenticated only)

**Features**:

- List of saved calculations
- Show name, date, GPA, course count
- Delete button with confirmation
- Click to load (optional feature)

**Pattern**: Follow `components/resources/resource-card.tsx` for card styling

---

### 6.5 ConversionScaleInfo (Optional)

**Location**: `src/components/gpa-converter/conversion-scale-info.tsx`

**Purpose**: Display the conversion scale table for selected standard

**Features**:

- Responsive table showing ranges
- Highlight current standard
- Link to official documentation

---

## 7. Implementation Phases

### [Phase 1: Foundation (Database & Backend)](./tasks/phase1.md)

### [Phase 2: API Development](./tasks/phase2.md)

### [Phase 3: Core UI Components](./tasks/phase3.md)

### [Phase 4: Advanced Features](./tasks/phase4.md)

### [Phase 5: Polish & Integration](./tasks/phase5.md)

### [Phase 6: Testing](./tasks/phase6.md)

### [Phase 7: Documentation & Deployment](./tasks/phase7.md)

---

## 8. File Structure

```
ioe-student-utils/
├── src/
│   ├── app/
│   │   └── gpa-converter/
│   │       ├── page.tsx                    # Main page
│   │       └── layout.tsx                  # Optional layout
│   │
│   ├── components/
│   │   └── gpa-converter/
│   │       ├── gpa-converter.tsx           # Main calculator component
│   │       ├── gpa-converter-hero.tsx      # Hero section
│   │       ├── gpa-calculator-results.tsx  # Results display
│   │       ├── saved-calculations.tsx      # History sidebar
│   │       ├── conversion-scale-info.tsx   # Scale display (optional)
│   │       ├── course-row.tsx              # Single course input row
│   │       └── standard-selector.tsx       # Standard dropdown (optional)
│   │
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts                   # Add GPA tables
│   │   │   └── seed.ts                     # Add standards seed data
│   │   │
│   │   └── elysia/
│   │       ├── index.ts                    # Register GPA routes
│   │       └── routes/
│   │           └── gpa-converter.ts        # API endpoints
│   │
│   ├── hooks/
│   │   └── use-gpa-converter.ts            # Custom hook for GPA API
│   │
│   └── lib/
│       └── gpa-conversion.ts               # Conversion logic utilities
│
├── e2e/
│   └── gpa-converter.spec.ts               # E2E tests
│
├── drizzle/
│   └── 000X_gpa-converter.ts               # Migration file
│
└── plans/
    └── tu-to-gpa-converter/
        ├── research.md                     # Research document
        └── IMPLEMENTATION_PLAN.md          # This file
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**File**: `src/__tests__/gpa-converter.test.ts`

**Test Cases**:

- [ ] Conversion from percentage to GPA (WES)
- [ ] Conversion from percentage to GPA (Scholaro)
- [ ] Cumulative GPA calculation
- [ ] Quality points calculation
- [ ] Edge cases:
  - [ ] Boundary percentages (e.g., 80% in WES)
  - [ ] Failed courses (0-49%)
  - [ ] Decimal percentages
  - [ ] Decimal credits
  - [ ] Empty course list
  - [ ] Single course
  - [ ] Large course list (50+)

**Coverage Goal**: > 80%

---

### 9.2 Integration Tests

**File**: `src/__tests__/gpa-converter-api.test.ts`

**Test Cases**:

- [ ] GET `/standards` returns all active standards
- [ ] POST `/calculate` returns correct GPA
- [ ] POST `/calculate` validates input
- [ ] POST `/save` requires authentication
- [ ] GET `/history` requires authentication
- [ ] DELETE `/:id` requires ownership
- [ ] Error handling for invalid data

**Coverage Goal**: > 70%

---

---

### 9.4 Manual Testing Checklist

**Functionality**:

- [ ] Can add unlimited courses
- [ ] Cannot remove last course
- [ ] Validation prevents invalid input
- [ ] Standard selector shows all standards
- [ ] Calculate button disabled when form invalid
- [ ] Loading state shows during calculation
- [ ] Results display correctly
- [ ] CSV export works
- [ ] Save works (authenticated)
- [ ] Login prompt shows (unauthenticated)

**UI/UX**:

- [ ] No console errors
- [ ] Smooth animations
- [ ] Responsive on mobile (320px+)
- [ ] Responsive on tablet (768px+)
- [ ] Responsive on desktop (1024px+)
- [ ] Good contrast ratios
- [ ] Keyboard navigation works
- [ ] Screen reader announces results

**Cross-Browser**:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Performance**:

- [ ] Initial load < 2s
- [ ] Calculation < 500ms
- [ ] No memory leaks
- [ ] Lighthouse score > 90

---

## 10. Success Criteria

### 10.1 Must Have (MVP)

- [ ] Convert TU percentage to GPA using WES standard
- [ ] Convert TU percentage to GPA using Scholaro standard
- [ ] Support multiple courses (transcript conversion)
- [ ] Calculate cumulative GPA
- [ ] Display results with grade letters
- [ ] Export results to CSV
- [ ] Mobile-responsive design
- [ ] No authentication required for basic use
- [ ] Optional save for authenticated users

### 10.2 Should Have

- [ ] Save calculation history (authenticated)
- [ ] Delete saved calculations
- [ ] Loading states for all async actions
- [ ] Error handling with user-friendly messages
- [ ] Keyboard navigation
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Analytics tracking
- [ ] SEO meta tags

### 10.3 Nice to Have

- [ ] Export to PDF
- [ ] Print-friendly layout
- [ ] Dark mode support
- [ ] Custom conversion standards (user-defined)
- [ ] Grade projection calculator
- [ ] Semester comparison tool
- [ ] Share calculation link
- [ ] Historical GPA tracking chart
- [ ] Import from CSV

---

## 11. Potential Risks & Mitigations

### Risk 1: Conversion Accuracy

**Risk**: Incorrect conversion standards could mislead students

**Mitigation**:

- Verify standards with official WES/Scholaro documentation
- Link to official sources
- Add disclaimer that results are estimates
- Allow users to verify with official services

### Risk 2: Performance with Large Transcripts

**Risk**: Slow conversion for 50+ courses

**Mitigation**:

- Implement virtual scrolling for course list
- Debounce input changes
- Use efficient database queries
- Add pagination if needed

### Risk 3: Authentication Complexity

**Risk**: Save feature adds complexity

**Mitigation**:

- Keep save feature optional
- Use existing auth infrastructure
- Clear UI prompts for login
- Graceful degradation for unauthenticated

### Risk 4: Browser Compatibility

**Risk**: Export features may not work in all browsers

**Mitigation**:

- Test in major browsers
- Provide fallback for CSV export
- Use widely-supported APIs
- Add browser compatibility checks

---

## 12. Future Enhancements

### Phase 8 (Post-MVP)

1. **Advanced Features**:
   - [ ] Grade projection ("What if I get X in this course?")
   - [ ] Semester-over-semester comparison
   - [ ] Target GPA calculator ("What grades do I need for 3.5 GPA?")
   - [ ] Class rank calculator
   - [ ] Major GPA vs Cumulative GPA

2. **Integrations**:
   - [ ] Link to University Finder (show if GPA meets requirements)
   - [ ] Link to Scholarship Finder (GPA-based eligibility)
   - [ ] Auto-fill from course database

3. **Export Options**:
   - [ ] Professional PDF report with letterhead
   - [ ] Copy to clipboard (formatted table)
   - [ ] Email to self
   - [ ] Shareable link (for anonymous users)

4. **Data Visualization**:
   - [ ] GPA trend chart over semesters
   - [ ] Grade distribution pie chart
   - [ ] Performance vs class average

5. **Customization**:
   - [ ] User-defined conversion standards
   - [ ] Save presets (e.g., "My Engineering Courses")
   - [ ] Custom grade scales (for other universities)

---

## 13. References

- [WES Nepal Grade Conversion](https://www.wes.org/)
- [Scholaro GPA Calculator](https://www.scholaro.com/gpa-calculator/)
- [TU Grading System](https://www.tu.edu.np/)
- Next.js 16 Documentation: https://nextjs.org/docs
- Elysia Documentation: https://elysiajs.com/
- Drizzle ORM Documentation: https://orm.drizzle.team/
- Shadcn UI: https://ui.shadcn.com/

---

## 14. Changelog

| Date       | Version | Changes                     |
| ---------- | ------- | --------------------------- |
| 2025-01-13 | 1.0     | Initial implementation plan |

---

## 15. Approval

**Reviewed By**: [Your Name]
**Date**: [Date]
**Status**: Pending Approval
**Next Steps**: Begin Phase 1 - Database & Backend Implementation

---

**Document Version**: 1.0
**Last Updated**: January 13, 2025
**Maintained By**: IOE Student Utils Development Team
