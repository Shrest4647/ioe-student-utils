# Course Explorer Design Document

## Overview

Course Explorer is an interactive course visualization and exploration tool designed to help students understand course structure, topic relationships, and prioritize their learning. It uses mindmap visualization for intuitive navigation and provides contextual resources for each topic.

## Goals

1. **Help students starting a new semester** get comprehensive understanding of course content
2. **Show topic hierarchy and relationships** using interactive mindmaps (resembling Google NotebookLM)
3. **Indicate priority topics** to focus on for efficient studying
4. **Show topic relationships** holistically for better comprehension
5. **Pre-load sources** (syllabus, notes, past questions, external resources) for ready access
6. **Provide curated study paths** (exam prep, concept mastery, minimum passing, etc.)
7. **Stay decoupled from Study Planner** but linkable for workflow integration
8. **Instructor-controlled content** with optional AI agent assistance via MCP tools

## Architecture

### Graph-Based Data Model

```
Course (root)
├── Units (level 1)
│   ├── Topics (level 2)
│   │   ├── Subtopics (level 3, recursive)
│   │   │   ├── Prerequisites (edges to other topics)
│   │   │   └── Resource Links (to resources library)
```

### Technology Choices

- **Mindmap**: React Flow (@xyflow/react) - chosen for D3-like capabilities with React integration
- **Backend**: Elysia.js with Drizzle ORM v1 beta
- **Database**: PostgreSQL with proper foreign key relationships
- **AI Assistance**: External AI agents (Claude Code) via MCP tools - NOT backend AI

## User Experience Design

### For Students

#### Landing Experience
- Course cards on landing page link to `/course-explorer/[course-slug]`
- First view: Full mindmap with all topics visible
- Left sidebar: Study path selector
- Right panel: Contextual sources (initially empty prompt)

#### Study Path Filtering
- **All Topics**: Default view, complete course structure
- **Exam Prep**: Highlights high-weightage topics, dims others
- **Minimum Passing**: Shows only core topics
- **Concept Mastery**: Full coverage with emphasis on foundations

#### Mindmap Interaction
- Click topic node → Sources panel slides in with topic details
- Color coding by priority:
  - Red (Core): Essential concepts
  - Orange (Important): Key topics
  - Gray (Optional): Nice to know
- Node size by hierarchy level (larger = higher level)
- Prerequisite edges:
  - Solid red animated line: Strong dependency (must complete first)
  - Gray line: Weak dependency (recommended)

#### Sources Panel
- Topic name and description
- Prerequisites list (if any)
- Resources section with:
  - Syllabus links
  - Notes
  - Videos
  - Practice materials
  - External references
- Each resource shows relevance tag (primary/supplementary/practice)

### For Instructors

#### Course Management Dashboard
- List of all courses with unit count
- Edit course structure button
- Preview (opens in new tab)
- Create new course

#### Course Structure Editor
- Tree view of units and topics
- Expand/collapse units
- Add/Edit/Delete units and topics
- Drag to reorder (future)
- AI assistant integration via MCP

## Data Schema

### course_units
```sql
- id: text (primary key)
- slug: text (unique)
- course_id: text (foreign key → academic_courses)
- name: text
- description: text (nullable)
- sort_order: integer (default 0)
- unit_type: enum (module, chapter)
- is_active: boolean (default true)
- created_at: timestamp
- updated_at: timestamp
```

### course_topics
```sql
- id: text (primary key)
- slug: text (unique)
- unit_id: text (foreign key → course_units)
- parent_topic_id: text (foreign key → course_topics, self-referential)
- name: text
- description: text (nullable)
- priority_level: enum (core, important, optional)
- hours: integer (default 0)
- weightage: decimal(5,2) (nullable)
- sort_order: integer (default 0)
- is_external_reference: boolean (default false)
- external_topic_id: text (nullable)
- is_active: boolean (default true)
- created_at: timestamp
- updated_at: timestamp
```

### topic_prerequisite
```sql
- id: text (primary key)
- topic_id: text (foreign key → course_topics)
- prerequisite_topic_id: text (foreign key → course_topics)
- dependency_type: enum (strong, weak)
- created_at: timestamp
```

### topic_resource_link
```sql
- id: text (primary key)
- topic_id: text (foreign key → course_topics)
- resource_id: text (foreign key → resources)
- relevance: enum (primary, supplementary, practice)
- sort_order: integer (default 0)
- created_at: timestamp
```

## API Design

### Route Patterns
- Public: `/api/course-explorer/{resource}/slug/:slug/*`
- Admin: `/api/course-explorer/{resource}/admin/*`

### Key Endpoints

1. **GET /courses/slug/:slug/mindmap?path=exam-prep**
   - Returns nodes and edges for React Flow
   - Filters by study path if provided

2. **GET /topics/slug/:slug**
   - Returns topic with prerequisites and resources

3. **POST /topics/slug/:slug/view**
   - Increments view count (for popularity tracking)

4. **Bulk Operations** (for MCP/AI agents)
   - POST /courses/admin/:id/units/bulk
   - POST /courses/admin/:id/topics/bulk
   - POST /prerequisites/admin/bulk
   - POST /courses/admin/:id/resources/bulk

## Study Path Logic

### Exam Prep
- Filter: Topics with weightage > 0 highlighted, others dimmed
- Focus: High-impact topics for exam scoring

### Minimum Passing
- Filter: Show only core topics
- Focus: Essential concepts to pass

### Concept Mastery
- Filter: All topics visible
- Focus: Comprehensive understanding

### Complexity-Based Paths (Future)
- Foundations First: Start with basics, build up
- Hardest First: Tackle complex topics early
- Quick Wins: Easy topics for confidence building

### Prerequisite-Aware Paths (Future)
- Follow Chain: Strict prerequisite order
- Skip Known: Test out of mastered topics
- Review Mode: Focus on prerequisite gaps

## Integration Points

### With Study Planner
- "Create Study Plan" button → Navigate to `/study-planner?course={slug}`
- Study Planner can fetch topic list from Course Explorer
- Decoupled design: Each tool works independently

### With Resources Library
- Links to existing resources table
- No duplication - reference by ID
- Relevance tagging for context

### With MCP Server
- IOESU MCP tools for bulk operations
- Enables AI agent automation
- Instructors can use Claude Code for setup

## Performance Considerations

### Mindmap Rendering
- React Flow handles large graphs well
- Consider virtualization for 100+ topics
- Lazy load topic details on click

### Data Fetching
- Mindmap data fetched once per course
- Topic details fetched on demand
- Cache study path filters

### Database Indexing
- Index on: slug fields, course_id, unit_id
- Composite indexes for common queries

## Accessibility

### Keyboard Navigation
- Tab through mindmap nodes
- Enter to select topic
- Arrow keys for study path selector
- Escape to close sources panel

### Screen Readers
- ARIA labels on interactive elements
- Announce topic selection
- Describe relationships (prerequisites)

### Visual Alternatives
- Tree view as alternative to mindmap
- High contrast mode support
- Text resize compatibility

## Security & Authorization

### Public Endpoints
- Read-only access to course structure
- No authentication required

### Admin Endpoints
- Require authentication
- Role-based access (instructor/admin)
- apiKeyOwnerOnly authorization macro

### MCP Tools
- Same auth as admin endpoints
- Audit logging for bulk operations
- Rate limiting on bulk creates

## Future Enhancements

1. **Collaborative Features**
   - Student notes on topics
   - Discussion threads
   - Community-contributed resources

2. **Progress Tracking**
   - Mark topics as learned
   - Track completion percentage
   - Sync with Study Planner progress

3. **AI-Powered Features**
   - Topic recommendations based on performance
   - Adaptive study paths
   - Knowledge gap analysis

4. **Advanced Visualizations**
   - 3D mindmap view
   - Timeline view (prerequisite chain)
   - Dependency graph view

5. **Analytics for Instructors**
   - View topic popularity
   - Identify difficult topics (high views, low resources)
   - Track prerequisite bottlenecks
