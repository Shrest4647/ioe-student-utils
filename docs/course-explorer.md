# Course Explorer

Interactive course exploration tool with mindmap visualization and curated study paths.

## Features

- **Mindmap Visualization**: Interactive graph showing topic relationships using React Flow
- **Study Paths**: Curated learning paths (Exam Prep, Concept Mastery, Minimum Passing, etc.)
- **Contextual Resources**: Automatic resource display based on selected topic
- **Prerequisite Tracking**: Visual dependencies between topics with strong/weak indicators
- **Instructor Tools**: Course structure management with AI-assisted organization via MCP
- **Resource Linking**: Connect topics to syllabus, notes, videos, and practice materials
- **View Tracking**: Track topic popularity for instructors

## User Guide

### For Students

1. Navigate to `/course-explorer/[course-slug]`
2. Select a study path from the left sidebar:
   - **All Topics**: View complete course structure
   - **Exam Prep**: Focus on high-weightage topics
   - **Minimum Passing**: Core topics only
   - **Concept Mastery**: Comprehensive coverage
3. Click topics in the mindmap to view resources
4. Check prerequisites before starting new topics (shown in Sources Panel)
5. Click "Create Study Plan" to integrate with Study Planner

### For Instructors

1. Navigate to `/instructor/courses`
2. Select a course to edit
3. Add units and topics with hierarchical structure
4. Define prerequisite relationships (strong/weak dependencies)
5. Link resources from the library
6. Use Claude Code with MCP tools for AI-assisted structuring:
   - Bulk create units/topics via MCP
   - Import from existing syllabi
   - Auto-generate prerequisite chains

## Data Model

### Course Structure
```
Course
├── Units (modules/chapters)
│   └── Topics (hierarchical, can have subtopics)
│       ├── Prerequisites (topic → topic)
│       └── Resource Links (topic → resource)
```

### Priority Levels
- **Core**: Essential concepts (red in mindmap)
- **Important**: Key topics (orange in mindmap)
- **Optional**: Nice to know (gray in mindmap)

### Prerequisite Types
- **Strong**: Must complete first (solid red line, animated)
- **Weak**: Recommended but not required (gray line)

## API Reference

### Public Endpoints

#### Get Courses
```
GET /api/course-explorer/courses
```

#### Get Course by Slug
```
GET /api/course-explorer/courses/slug/:slug
```

#### Get Mindmap Data
```
GET /api/course-explorer/courses/slug/:slug/mindmap?path=exam-prep
```

Query parameters:
- `path`: Study path filter (exam-prep, minimum, mastery)

#### Get Unit
```
GET /api/course-explorer/units/slug/:slug
```

#### Get Unit Topics
```
GET /api/course-explorer/units/slug/:slug/topics
```

#### Get Topic
```
GET /api/course-explorer/topics/slug/:slug
```

#### Increment Topic View Count
```
POST /api/course-explorer/topics/slug/:slug/view
```

### Admin Endpoints (Require Authentication)

#### Create/Update/Delete Course
```
POST /api/course-explorer/courses/admin
PUT /api/course-explorer/courses/admin/:id
DELETE /api/course-explorer/courses/admin/:id
```

#### Create/Update/Delete Unit
```
POST /api/course-explorer/units/admin
PUT /api/course-explorer/units/admin/:id
DELETE /api/course-explorer/units/admin/:id
```

#### Create/Update/Delete Topic
```
POST /api/course-explorer/topics/admin
PUT /api/course-explorer/topics/admin/:id
DELETE /api/course-explorer/topics/admin/:id
```

#### Bulk Operations (for MCP/AI agents)
```
POST /api/course-explorer/courses/admin/:id/units/bulk
POST /api/course-explorer/courses/admin/:id/topics/bulk
POST /api/course-explorer/prerequisites/admin/bulk
POST /api/course-explorer/courses/admin/:id/resources/bulk
```

## Integration with Study Planner

Course Explorer and Study Planner are decoupled but linkable:
- Course Explorer helps students understand **what** to study
- Study Planner helps students schedule **when** to study
- "Create Study Plan" button passes selected course to Study Planner
- Students can export topics from Course Explorer to Study Planner sessions

## MCP Tools for Instructors

The IOESU MCP server provides tools for AI-assisted course management:
- Bulk create units/topics
- Link resources to topics
- Set up prerequisite chains
- Import/export course structures

This enables using Claude Code or other AI agents to automate course setup.

## Technical Stack

- **Frontend**: Next.js 16, React 19, React Flow (@xyflow/react)
- **Backend**: Elysia.js, Drizzle ORM v1 beta
- **Database**: PostgreSQL with hierarchical course data
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion

## Future Enhancements

- Collaborative note-taking on topics
- Progress tracking integration
- AI-powered topic recommendations
- Community-contributed resources
- Cross-course prerequisite tracking
