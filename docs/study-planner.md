# Study Planner

A comprehensive study planning feature that helps IOE students plan and track their academic schedules with structured day-by-day study tasks, progress tracking, and smart notifications.

## Overview

The Study Planner provides a Gregmat-style structured approach to exam preparation, offering:

- **Multiple Plan Durations**: 1-day, 3-day, 1-week, 2-week, 1-month, and custom duration plans
- **Day-by-Day Tasks**: Each day contains small, completable tasks organized by learning, practice, review, and preparation
- **Generic Templates**: Reusable templates that adapt to any subject through pattern replacement
- **Progress Tracking**: Visual progress indicators with on-track/behind/ahead status
- **Academic Events**: Track exams, assignments, projects, and lab schedules

## Database Schema

### Tables

#### 1. `academic_events`

Stores academic events like exams, assignments, projects, and labs.

```typescript
{
  id: uuid,                    // Primary key
  userId: text,                // Reference to user.id
  subjectName: varchar(255),   // Subject name
  eventType: varchar(50),      // 'exam', 'assignment', 'project', 'lab'
  title: varchar(255),         // Event title
  description: text,           // Event description
  eventDate: date,             // Event date
  eventTime: time,             // Optional event time
  location: varchar(255),      // Optional location
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**

- `academic_event_user_id_idx` - For user-specific queries
- `academic_event_date_idx` - For date-based filtering

#### 2. `study_templates`

Reusable study plan templates with daily structure patterns.

```typescript
{
  id: uuid,                    // Primary key
  name: varchar(255),          // Template name (e.g., "2-Week Comprehensive Plan")
  durationDays: integer,       // Number of days (1, 3, 7, 14, 30)
  difficultyLevel: varchar(50), // 'intensive', 'moderate', 'comprehensive'
  dailyStructure: jsonb,       // Task patterns for morning/afternoon/evening
  intensityCurve: jsonb,       // Intensity mapping per day range
  subjectArea: varchar(100),   // Subject category
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Daily Structure Format:**

```json
{
  "morning": [
    {
      "type": "learn",
      "template": "Study {TOPIC} from Chapter {CHAPTER}",
      "estimated_minutes": 45
    }
  ],
  "afternoon": [
    {
      "type": "practice",
      "template": "Solve {PROBLEM_COUNT} problems on {TOPIC}",
      "estimated_minutes": 60
    }
  ],
  "evening": [
    {
      "type": "review",
      "template": "Review today's {TOPIC} notes",
      "estimated_minutes": 15
    }
  ]
}
```

**Indexes:**

- `study_templates_subject_area_idx` - For subject filtering
- `study_templates_difficulty_idx` - For difficulty filtering

#### 3. `study_plans`

Active study plans created by users from templates.

```typescript
{
  id: uuid,                    // Primary key
  userId: text,                // Reference to user.id
  templateId: uuid,            // Reference to study_templates.id
  subjectName: varchar(255),   // Subject being studied
  examDate: date,              // Target exam date
  startDate: date,             // Plan start date
  endDate: date,               // Plan end date
  dailyTasks: jsonb,           // Generated tasks per day
  progressPercentage: decimal(5,2), // Completion percentage
  status: varchar(50),         // 'active', 'completed', 'archived'
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Daily Tasks Format:**

```json
{
  "1": [
    {
      "id": "uuid",
      "title": "Study Binary Search Trees from Chapter 5",
      "description": "",
      "taskType": "learn",
      "estimatedMinutes": 45
    }
  ],
  "2": [...]
}
```

**Indexes:**

- `study_plans_user_id_idx` - For user-specific queries
- `study_plans_status_idx` - For status filtering
- `study_plans_exam_date_idx` - For exam date queries

#### 4. `study_tasks`

Individual completable tasks within a study plan.

```typescript
{
  id: uuid,                    // Primary key
  studyPlanId: uuid,           // Reference to study_plans.id
  dayNumber: integer,          // Day in the plan (1-indexed)
  title: varchar(255),         // Task title
  description: text,           // Task description
  taskType: varchar(50),       // 'learn', 'practice', 'review', 'prepare'
  estimatedMinutes: integer,   // Estimated time
  completed: boolean,          // Completion status
  completedAt: timestamp,      // When completed
  actualMinutesSpent: integer, // Actual time spent
  notes: text,                 // User notes
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Indexes:**

- `study_tasks_study_plan_id_idx` - For plan-specific queries
- `study_tasks_completed_idx` - For completion filtering
- `study_tasks_day_number_idx` - For day-based queries

#### 5. `study_logs`

Optional time tracking logs for study sessions.

```typescript
{
  id: uuid,                    // Primary key
  taskId: uuid,                // Reference to study_tasks.id
  userId: text,                // Reference to user.id
  minutesSpent: integer,       // Time spent in minutes
  notes: text,                 // Session notes
  loggedAt: timestamp          // When logged
}
```

**Indexes:**

- `study_logs_task_id_idx` - For task-specific queries
- `study_logs_user_id_idx` - For user-specific queries

## API Endpoints

### Academic Events

| Method | Endpoint                   | Description                     |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/api/academic-events`     | List all user's academic events |
| GET    | `/api/academic-events/:id` | Get specific academic event     |
| POST   | `/api/academic-events`     | Create new academic event       |
| PATCH  | `/api/academic-events/:id` | Update academic event           |
| DELETE | `/api/academic-events/:id` | Delete academic event           |

**Query Parameters for GET /api/academic-events:**

- `startDate` (optional) - Filter by start date
- `endDate` (optional) - Filter by end date
- `eventType` (optional) - Filter by event type

**Request Body for POST /api/academic-events:**

```typescript
{
  subjectName: string;
  eventType: string;      // 'exam', 'assignment', 'project', 'lab'
  title: string;
  description?: string;
  eventDate: string;      // ISO date string
  eventTime?: string;     // Time string
  location?: string;
}
```

### Study Plans

| Method | Endpoint                  | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/api/study-plans`        | List all user's study plans               |
| GET    | `/api/study-plans/today`  | Get today's tasks across all active plans |
| GET    | `/api/study-plans/:id`    | Get specific study plan with tasks        |
| POST   | `/api/study-plans/create` | Create new study plan from template       |
| PATCH  | `/api/study-plans/:id`    | Update study plan                         |
| DELETE | `/api/study-plans/:id`    | Archive study plan                        |

**Request Body for POST /api/study-plans/create:**

```typescript
{
  templateId: string;
  subjectName: string;
  topics: Array<{
    name: string;
    chapter?: string;
    difficulty?: "easy" | "medium" | "hard";
  }>;
  examDate: string; // ISO date string
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}
```

**Response for GET /api/study-plans/today:**

```typescript
{
  success: boolean;
  data: Array<{
    planId: string;
    subjectName: string;
    examDate: Date;
    dayNumber: number;
    task: {
      id: string;
      title: string;
      description: string;
      taskType: string;
      estimatedMinutes: number;
    };
  }>;
}
```

### Study Tasks

| Method | Endpoint                          | Description             |
| ------ | --------------------------------- | ----------------------- |
| GET    | `/api/study-tasks/:id`            | Get task details        |
| PATCH  | `/api/study-tasks/:id/complete`   | Mark task as complete   |
| PATCH  | `/api/study-tasks/:id/uncomplete` | Mark task as incomplete |
| POST   | `/api/study-tasks/:id/log-time`   | Log study time for task |

**Request Body for POST /api/study-tasks/:id/log-time:**

```typescript
{
  minutes: number;
  notes?: string;
}
```

## Components

### StudyPlannerDashboard

Main dashboard component that displays:

- Statistics cards (Active Plans, Today's Tasks, Overall Progress)
- List of active study plans with progress bars
- Today's tasks section
- Quick action to create new plans

**Location:** `src/components/study-planner/StudyPlannerDashboard.tsx`

**Usage:**

```tsx
import { StudyPlannerDashboard } from "@/components/study-planner";

export default function StudyPlannerPage() {
  return <StudyPlannerDashboard />;
}
```

### StudyPlanCreator

Wizard component for creating new study plans:

- Subject name input
- Template selection (1-Day Sprint, 3-Day Boost, 1-Week Plan, etc.)
- Topic management (add/remove topics)
- Exam date picker
- Form validation

**Location:** `src/components/study-planner/StudyPlanCreator.tsx`

**Props:**

```typescript
interface StudyPlanCreatorProps {
  onSuccess?: () => void; // Callback after successful creation
}
```

### DailyTaskView

Displays today's tasks with:

- Progress bar showing completion percentage
- Task cards with checkboxes
- Task type badges (learn, practice, review, prepare)
- Estimated time display
- Toggle completion status

**Location:** `src/components/study-planner/DailyTaskView.tsx`

**Features:**

- Color-coded task types:
  - Learn: Blue
  - Practice: Orange
  - Review: Purple
  - Prepare: Green
- Animated progress bar using Framer Motion
- Empty state when no tasks scheduled

### Component Index

All components are exported from:

**Location:** `src/components/study-planner/index.ts`

```typescript
export { DailyTaskView } from "./DailyTaskView";
export { StudyPlanCreator } from "./StudyPlanCreator";
export { StudyPlannerDashboard } from "./StudyPlannerDashboard";
```

## User Workflow

### 1. Creating a Study Plan

1. Navigate to the Study Planner dashboard
2. Click "New Study Plan" button
3. Fill in the creation form:
   - Enter subject name (e.g., "Data Structures")
   - Select plan duration/template
   - Add topics to cover (e.g., "Arrays", "Linked Lists", "Trees")
   - Select exam date
4. Submit to generate the plan

The system will:

- Distribute topics across the plan duration
- Generate specific tasks from template patterns
- Create individual task records in the database

### 2. Managing Daily Tasks

1. View today's tasks on the dashboard
2. Check off completed tasks
3. Track actual time spent (optional)
4. Add notes to tasks if needed

Task completion automatically:

- Updates the task's `completed` status
- Updates the plan's `progressPercentage`
- Records completion timestamp

### 3. Logging Study Sessions

For detailed time tracking:

1. Start a study session
2. Log time via the API or UI
3. Add session notes
4. View accumulated time per task

### 4. Tracking Progress

The dashboard shows:

- **Active Plans Count**: Number of ongoing study plans
- **Today's Tasks**: Tasks scheduled for today across all plans
- **Overall Progress**: Average completion percentage across all plans

Individual plan cards display:

- Subject name
- Progress percentage with visual bar
- Exam date countdown
- Status badge (On Track / In Progress)

### 5. Managing Academic Events

Track important dates:

1. Add exams, assignments, projects, or lab schedules
2. View events in chronological order
3. Filter by date range or event type
4. Update or delete events as needed

## Available Templates

The system comes with pre-defined templates:

| Template             | Duration | Description                    |
| -------------------- | -------- | ------------------------------ |
| 1-Day Sprint         | 1 day    | Intensive single-day review    |
| 3-Day Boost          | 3 days   | Quick preparation plan         |
| 1-Week Plan          | 7 days   | Standard weekly preparation    |
| 2-Week Comprehensive | 14 days  | Thorough two-week plan         |
| 1-Month Plan         | 30 days  | Comprehensive month-long study |

Each template defines:

- Daily structure (morning/afternoon/evening tasks)
- Intensity curve (warmup → normal → intensive → review)
- Estimated time per task type

## Template Pattern Replacement

Templates use placeholders that get replaced with actual content:

| Placeholder         | Description            | Example Output        |
| ------------------- | ---------------------- | --------------------- |
| `{TOPIC}`           | Topic name             | "Binary Search Trees" |
| `{CHAPTER}`         | Chapter number         | "Chapter 5"           |
| `{PROBLEM_COUNT}`   | Number of problems     | "5"                   |
| `{RANGE}`           | Exercise range         | "5.1 to 5.4"          |
| `{KEY_TERMS_COUNT}` | Number of terms        | "10"                  |
| `{PREVIOUS_DAY}`    | Previous day reference | "Day 4"               |

## Seeding Templates

To seed the default study templates:

```bash
bun src/server/db/seeders/seed-study-templates.ts
```

Or run the main seeder:

```bash
bun src/server/db/seeders/seed.ts
```

## Related Documentation

- [Elysia.js Guide](./elysia.md) - Backend API framework
- [Drizzle ORM Guide](./drizzle.md) - Database ORM
- [Study Planner Design](./plans/2026-01-31-study-planner-design.md) - Original design document
- [Study Planner Implementation](./plans/2026-01-31-study-planner-implementation.md) - Implementation plan
