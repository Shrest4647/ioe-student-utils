# Study Planner Feature Design

**Date:** 2026-01-31
**Status:** Design Approved
**Priority:** High

## Overview

A comprehensive Study Planner to help IOE students plan and track their academic schedules, including exam dates, assignments, and study goals. Inspired by Gregmat's structured study plans, this feature provides day-by-day actionable tasks with scalable templates that work for any subject and duration.

## Core Features

### 1. Structured Study Plans
- **Multiple Plan Durations**: 1-day, 3-day, 1-week, 2-week, 1-month, and custom duration plans
- **Gregmat-style Day-by-Day Tasks**: Each day contains small, completable tasks (learning, practice, review)
- **Generic Templates**: Reusable templates that adapt to any subject through pattern replacement
- **Smart Task Generation**: Automatically generates specific tasks from generic patterns based on syllabus topics

### 2. Dashboard Interface
- **Today's Focus**: Large card showing 2-4 prioritized tasks for immediate action
- **Upcoming Deadlines Timeline**: 7-14 day view with color-coded event types
- **Subject Progress Grid**: Per-subject cards with circular progress indicators and countdowns
- **Quick Actions**: Add events, create plans, notification settings

### 3. Smart Notifications System
- **Daily Morning Agenda**: Email/browser notification at 8 AM with today's tasks
- **Deadline Reminders**: 7-day, 3-day, and 1-day countdown alerts
- **Progress-based Alerts**: Warnings when falling behind schedule with one-click reschedule options
- **Smart Prioritization Engine**: Considers urgency, progress, difficulty, and available time

### 4. Progress Tracking
- **Hybrid System**: Quick checkboxes + optional time logging
- **Visual Progress**: Day counter, progress bars, on-track/behind/ahead indicators
- **Study Session Logging**: Optional time tracking with notes
- **Post-Exam Analytics**: Completion stats, performance insights

## Technical Architecture

### Database Schema

```sql
-- Academic Events (exams, assignments, etc.)
academic_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  subject_name VARCHAR(255),
  event_type VARCHAR(50), -- 'exam', 'assignment', 'project', 'lab'
  title VARCHAR(255),
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  location VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Study Plan Templates (reusable templates)
study_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  duration_days INTEGER NOT NULL,
  difficulty_level VARCHAR(50),
  daily_structure JSONB NOT NULL, -- task patterns for each day
  subject_area VARCHAR(100),
  created_at TIMESTAMP
);

-- Active Study Plans (student's instantiated plan)
study_plans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES study_templates(id),
  subject_name VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_tasks JSONB NOT NULL, -- actual generated tasks
  progress_percentage DECIMAL(5,2),
  status VARCHAR(50), -- 'active', 'completed', 'archived'
  created_at TIMESTAMP
);

-- Study Tasks (individual completable items)
study_tasks (
  id UUID PRIMARY KEY,
  study_plan_id UUID REFERENCES study_plans(id),
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50), -- 'learn', 'practice', 'review', 'prepare'
  estimated_minutes INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  actual_minutes_spent INTEGER,
  notes TEXT
);

-- Study Logs (optional time tracking)
study_logs (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES study_tasks(id),
  user_id UUID NOT NULL,
  minutes_spent INTEGER NOT NULL,
  notes TEXT,
  logged_at TIMESTAMP
);
```

### API Endpoints

```
POST   /api/study-plans/create              - Generate plan from template
GET    /api/study-plans                      - List all user's plans
GET    /api/study-plans/[id]                 - Get full plan with all tasks
GET    /api/study-plans/today                - Get today's tasks across all plans
PATCH  /api/study-plans/[id]                 - Update plan details
DELETE /api/study-plans/[id]                 - Delete/archive plan

PATCH  /api/study-tasks/[id]/complete        - Mark task complete
PATCH  /api/study-tasks/[id]/uncomplete      - Mark task incomplete
POST   /api/study-tasks/[id]/log-time        - Log study time
GET    /api/study-tasks/[id]                 - Get task details

GET    /api/study-plans/[id]/progress        - Get progress analytics
GET    /api/study-plans/[id]/calendar        - Get calendar view data

POST   /api/academic-events                  - Add exam/assignment/event
GET    /api/academic-events                  - List all events
PATCH  /api/academic-events/[id]             - Update event
DELETE /api/academic-events/[id]             - Delete event
```

### Frontend Components

```
components/study-planner/
├── StudyPlanCreator.tsx          # Setup wizard for creating plans
├── DailyTaskView.tsx              # Today's tasks with checkboxes
├── StudyPlanProgress.tsx          # Progress bars and stats
├── StudyPlanCalendar.tsx          # Visual timeline view
├── StudyPlanCard.tsx              # Individual plan card
├── TaskCard.tsx                   # Individual task component
├── NotificationSettings.tsx       # Customize alerts
└── StudyPlannerDashboard.tsx      # Main dashboard layout
```

## Template Generation System

### Template Structure

Templates use generic patterns that get replaced with actual content:

```json
{
  "name": "2-Week Comprehensive Plan",
  "duration_days": 14,
  "daily_pattern": {
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
      },
      {
        "type": "practice",
        "template": "Complete exercises {RANGE}",
        "estimated_minutes": 30
      }
    ],
    "evening": [
      {
        "type": "review",
        "template": "Review today's {TOPIC} notes",
        "estimated_minutes": 15
      },
      {
        "type": "prepare",
        "template": "Make flashcards for {KEY_TERMS_COUNT} terms",
        "estimated_minutes": 20
      }
    ]
  },
  "intensity_curve": {
    "days_1_3": "warmup",
    "days_4_10": "normal",
    "days_11_13": "intensive",
    "day_14": "review_only"
  }
}
```

### Generation Algorithm

1. **Input**: Subject + exam date + available days
2. **Fetch Content**: Get syllabus topics (manual entry or imported)
3. **Distribute Topics**: Spread topics based on difficulty, importance, intensity curve
4. **Generate Tasks**: Replace placeholders with actual content
5. **Adjust for Time**: Scale task count based on daily availability

### Example Output (Day 5)

- ☐ Study Binary Search Trees from Chapter 5 (45 min)
- ☐ Solve 5 problems on BST operations (60 min)
- ☐ Complete exercises 5.1 to 5.4 (30 min)
- ☐ Review today's Binary Search Trees notes (15 min)
- ☐ Make flashcards for 10 key BST terms (20 min)

## User Workflow

### Step 1: Quick Setup
- Click "Start Study Plan" from dashboard
- Select subject and upcoming exam
- Choose plan duration based on days available
- System suggests appropriate template

### Step 2: Preview & Customize
- View full day-by-day plan preview
- Adjust daily time commitment
- Mark known topics to skip
- Add custom tasks if needed
- Rearrange tasks between days

### Step 3: Active Study Mode
- Today's view shows exactly what to do, in order
- Large checkboxes for each task
- Optional timer for study sessions
- Quick note-taking for each task
- Reschedule option if falling behind

### Step 4: Progress Tracking
- Visual progress: "Day 5 of 14 • 35% complete"
- Subject-level progress bars
- On Track / Behind Schedule / Ahead indicator
- Detailed analytics view (optional)

### Step 5: Post-Exam
- Archive completed plan
- Show completion stats
- Option to keep or delete detailed records

## Notification System

### Daily Morning Agenda

```
📚 Today's Study Plan - Day 5 of 14
⏰ Estimated time: 2.5 hours

Data Structures:
☐ Study Binary Search Trees (45 min)
☐ Solve 5 BST problems (60 min)
☐ Review yesterday's notes (15 min)
☐ Make flashcards for key terms (30 min)

💡 Tip: Focus on BST deletion algorithm - it's commonly tested

You're AHEAD of schedule! 🎉
```

### Reminder Schedule

- **7 days before exam**: Progress check with on-track status
- **3 days before exam**: Priority topic focus
- **1 day before exam**: Light review only reminder
- **Behind schedule**: Warning with one-click reschedule options

### Smart Prioritization

The daily agenda engine considers:
1. **Urgency**: Exams happening sooner
2. **Progress**: Subjects falling behind
3. **Difficulty**: Hard topics scheduled earlier
4. **Time available**: Adjusts based on student's hours

## Visual Design

### Color System

- Green (#22c55e): Completed tasks, on-track progress
- Blue (#3b82f6): Learning tasks
- Orange (#f97316): Practice problems
- Purple (#a855f7): Review tasks
- Red (#ef4444): Urgent alerts, behind schedule
- Gray (#6b7280): Future/not started

### Task Cards

- Large checkbox (32px) on left
- Title + subtitle with estimated time
- Task type icon + optional timer button
- Hover: lift + shadow effect
- Completed: strikethrough + green checkmark + confetti

### Progress Indicators

- Circular progress for subject completion
- Linear progress bar for overall plan
- Daily progress ring for today
- Smooth transitions on updates

### Responsive Design

- Desktop: 3-column layout (tasks | calendar | subjects)
- Tablet: 2-column (tasks + sidebar)
- Mobile: Single column with bottom navigation

## Edge Cases & Error Handling

### Student Falls Behind
- Detection: Completed tasks < expected
- Options: Redistribute tasks, increase daily time, drop low-priority tasks, extend plan
- Prevention: Warn after 2 missed days

### Exam Date Changes
- Earlier exam: Compress remaining days, show warning
- Later exam: Add buffer/review days or extend at same pace
- Conflict detection: Alert for overlapping exams

### New Topic Added Mid-Plan
- Insert into first available light day
- Or append with warning about completion date

### Student Finishes Early
- Celebrate with animation
- Offer: More practice problems or revision mode

### Multiple Exams Conflict
- Prioritize earlier exam
- Split-screen view of both plans
- Suggest focus mode by week

## Implementation Phases

### Phase 1: Core Functionality
- Database schema and migrations
- Basic CRUD operations for plans and tasks
- Simple plan creation workflow
- Task completion tracking

### Phase 2: Template System
- Template data structure
- Template generation algorithm
- Pattern replacement logic
- Sample templates for common durations

### Phase 3: Dashboard & UI
- Main dashboard layout
- Today's tasks view
- Progress visualization
- Calendar view

### Phase 4: Smart Features
- Notification system
- Smart scheduling engine
- Behind-schedule detection
- Progress-based alerts

### Phase 5: Polish & Optimization
- Animations and micro-interactions
- Performance optimization
- Mobile responsiveness
- A/B testing infrastructure

## Success Metrics

- **Adoption**: % of students who create at least one study plan
- **Completion Rate**: % of plans reaching 80%+ completion
- **Retention**: % of users returning after 1 week
- **Engagement**: Average tasks completed per user per day
- **Satisfaction**: User feedback score (1-5 scale)
- **Time to First Plan**: Target <3 minutes

## Future Enhancements

- Integration with Syllabus Explorer for auto-populating topics
- AI-assisted personalized study plan generation
- Collaborative study groups
- Spaced repetition algorithm for review tasks
- Mobile app (React Native)
- Export to calendar (Google Calendar, iCal)
- Print-friendly PDF export
- Study streaks and gamification
