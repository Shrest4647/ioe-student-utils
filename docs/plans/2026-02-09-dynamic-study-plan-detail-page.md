# Dynamic Study Plan Detail Page Design

**Date:** 2026-02-09
**Status:** Ready for Implementation
**Goal:** Transform static study plan detail page into fully interactive task management system

## Problem Statement

Current study plan detail page displays tasks statically. Users cannot:
- Mark tasks as complete
- Track time spent on tasks
- Add notes or resources
- Reschedule or reorder tasks

## Solution Overview

Convert task cards into interactive, expandable components with inline controls for task management. Each task supports completion tracking, timer functionality, notes/resources, and rescheduling.

## Architecture

### Component Structure
```
StudyPlanDetailPage
├── PlanOverview (progress visualization)
├── DayGroup (tasks grouped by day, supports drag-drop)
│   └── TaskCard (expandable card with all controls)
│       ├── TaskTimer (start/pause/stop timer)
│       ├── TaskNotes (auto-save textarea)
│       ├── TaskResources (link/file manager)
│       └── TaskActions (complete/reschedule/delete)
```

### State Management
- **Local State:** Timer state (running, paused, elapsed), expanded/collapsed cards
- **Optimistic UI:** Task completion updates immediately, mutations in background
- **Persistence:** React Query mutations for all updates, localStorage for timer recovery

### Data Flow
1. Timer runs with `setInterval`, persists every 30s or on pause/stop
2. Task completion triggers local UI update + backend mutation
3. Plan progress recalculates on any task change
4. Notes/resources auto-save with 1s debounce
5. Rescheduling uses optimistic update with rollback on error

## Task Card Design

### Collapsed State
- Task type icon with colored background
- Title and description (truncated to 2 lines)
- Status badge (pending/in-progress/completed)
- Timer preview: "0:00 / 45min" format
- Expand chevron indicator

### Expanded State (Framer Motion animation)
- Full title and description
- Active timer section (prominent when running)
- Notes textarea with markdown support
- Resources pills with type-specific icons
- Action buttons: Complete, Reschedule, Delete
- Collapse control

### Visual States
- **Pending:** Default appearance, "Start" button prominent
- **Timer Running:** Pulsing border glow, live time display
- **Paused:** Static border, "Resume" and "Reset" buttons
- **Completed:** Grayscale with green checkmark, "Mark Incomplete" button

## Timer & Progress Tracking

### Timer Component (`TaskTimer`)
- **State:** `timeElapsed` (seconds), `isRunning`, `isPaused`
- **Persistence:** localStorage + backend every 30s
- **Format:** MM:SS display, compares to estimated time
- **Controls:** Start, Pause, Stop, Reset (when paused)

### Progress Dashboard
- Circular progress indicator for overall plan completion
- Day-by-day progress bars
- Streak counter for consecutive completed days
- Real-time recalculation on task changes

### Timer Recovery
On component mount, check localStorage for active timer state to recover from page refresh.

## Notes & Resources

### Notes Feature
- Auto-resize textarea (max 300px height)
- Character counter: "342/2000"
- Auto-save with 1s debounce
- Visual indicators: "Saving..." → "All changes saved"
- Markdown support with preview toggle

### Resources Manager
- JSON structure: `[{ id, type, url, title }]`
- Types: `link`, `file`, `video`, `document`
- Type-specific icons and actions
- Add/remove via inline form
- Drag to reorder within task

## Rescheduling & Reordering

### Drag & Drop
- Drag handle on left of each task card
- Reorder within same day
- Drag to different day group
- Uses `@dnd-kit/core` for smooth animations

### Rescheduling Controls
- "Reschedule" button opens date picker
- Or number input: "Move to day X"
- Visual animation shows task transition

### Bulk Actions
- Multi-select mode with checkboxes
- "Move all to day X"
- "Mark all as complete"
- "Copy tasks to another day"

### Day Management
- Day headers: "Day 3 • 4/6 tasks done"
- Click to collapse/expand all tasks in day
- Drop zones for moving tasks between days
- Daily time totals with warnings if > 8 hours

## Backend API Updates

### New Endpoints

**1. PATCH `/api/study-plans/tasks/:id`**
```typescript
{
  completed?: boolean,
  actualMinutesSpent?: number,
  notes?: string,
  resources?: Array<{
    id: string,
    type: 'link' | 'file' | 'video' | 'document',
    url: string,
    title: string
  }>
}
```

**2. PATCH `/api/study-plans/:planId/tasks/reorder`**
```typescript
{
  updates: Array<{
    taskId: string,
    dayNumber: number,
    order: number
  }>
}
```

**3. POST `/api/study-plans/tasks/:id/timer`**
```typescript
{
  action: 'start' | 'pause' | 'stop',
  elapsedSeconds: number
}
```

**4. GET `/api/study-plans/:slug/progress`**
Returns overall progress, daily breakdown, streak, analytics.

### Database Schema Changes

**Add to `study_tasks` table:**
```sql
ALTER TABLE study_tasks ADD COLUMN resources JSONB DEFAULT '[]';
ALTER TABLE study_tasks ADD COLUMN timer_sessions JSONB DEFAULT '[]';
CREATE INDEX study_tasks_day_number_idx ON study_tasks(day_number);
```

## Implementation Order

### Phase 1: Core Task Management
1. Update database schema (migration)
2. Add backend endpoints (task update, progress)
3. Expandable task card component
4. Task completion toggle with optimistic UI
5. Progress recalculation

### Phase 2: Timer Functionality
1. TaskTimer component with start/pause/stop
2. Timer persistence (localStorage + backend)
3. Timer recovery on page load
4. Time spent visualization

### Phase 3: Notes & Resources
1. TaskNotes component with auto-save
2. Resources manager UI
3. Backend updates for notes/resources
4. Markdown preview for notes

### Phase 4: Rescheduling & Reordering
1. Drag & drop library integration
2. Task reordering within days
3. Moving tasks between days
4. Bulk actions

## Success Criteria

- ✅ Users can mark tasks complete with visual feedback
- ✅ Timer accurately tracks time, persists across sessions
- ✅ Notes auto-save reliably, show clear save status
- ✅ Tasks can be rescheduled with smooth animations
- ✅ Plan progress updates in real-time
- ✅ All optimistic updates rollback gracefully on errors

## Future Enhancements

- WebSocket for real-time collaboration
- Study reminders and notifications
- Timer analytics and insights
- Task templates and favorites
- Export study plan as PDF/calendar
