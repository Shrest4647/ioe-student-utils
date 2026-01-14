# Schedule View Implementation

## Overview

A Google Calendar-inspired **Schedule View** has been successfully added to the full calendar system. This view displays events in a vertical, agenda-style format with horizontal scrolling, perfect for seeing multiple days side by side.

## Features

### Schedule View in Full Calendar

The schedule view (`view="schedule"`) has been integrated into the main calendar system with the following features:

1. **3-Day View**: Shows 3 consecutive days by default (configurable in code)
2. **Horizontal Scrolling**: Navigate between days using prev/next buttons
3. **All-Day Events Section**: Events spanning 23+ hours are shown at the top of each day
4. **Vertical Time Axis**: 24-hour timeline on the left side
5. **Event Cards**: Color-coded events with proper positioning and sizing
6. **Current Time Indicator**: Red line showing the current time on today's column
7. **Sticky Day Headers**: Day headers remain visible while scrolling
8. **Hover Cards**: Detailed event information on hover
9. **Keyboard Navigation**: Press `S` to switch to schedule view
10. **Date Range Display**: Header shows the date range (e.g., "Jan 11 – 13, 2026")

### Reusable Schedule Widget

A standalone `ScheduleWidget` component has been created that can be embedded anywhere in the application:

**Location**: `/src/components/calendar/schedule-widget.tsx`

**Props**:
```typescript
type ScheduleWidgetProps = {
  events?: CalendarEvent[];        // Array of calendar events
  defaultDate?: Date;              // Starting date (default: today)
  locale?: Locale;                 // Date locale (default: enUS)
  numberOfDays?: 3 | 5 | 7;        // Number of days to show (default: 3)
  height?: string;                 // Widget height (default: "600px")
  onEventClick?: (event) => void;  // Event click handler
  showHeader?: boolean;            // Show/hide navigation header (default: true)
  showAllDaySection?: boolean;     // Show/hide all-day events (default: true)
  className?: string;              // Additional CSS classes
}
```

## Usage Examples

### 1. Using Schedule View in Full Calendar

The schedule view is already integrated into the scholarship calendar at `/scholarships/calendar`:

```tsx
import { Calendar } from "@/components/calendar/full-calendar";
import { CalendarScheduleView } from "@/components/calendar/full-calendar";

<Calendar events={events} view="schedule">
  <CalendarStandardLayout />
</Calendar>
```

**Navigation**:
- Click the "Schedule" button in the view selector
- Press `S` keyboard shortcut
- Use arrow keys (←/→) to navigate by 3 days
- Press `T` to jump to today

### 2. Using the Standalone Schedule Widget

```tsx
import { ScheduleWidget } from "@/components/calendar/schedule-widget";

// Basic usage
<ScheduleWidget events={events} />

// With custom options
<ScheduleWidget
  events={events}
  numberOfDays={5}
  height="800px"
  showHeader={true}
  onEventClick={(event) => console.log(event)}
/>
```

### 3. Creating a Custom Schedule View

```tsx
import { ScheduleWidget } from "@/components/calendar/schedule-widget";

function MySchedulePage() {
  const [events] = useState([
    {
      id: "1",
      start: new Date("2026-01-13T09:00:00"),
      end: new Date("2026-01-13T10:30:00"),
      title: "Team Meeting",
      color: "blue",
      description: "Weekly team sync"
    },
    // ... more events
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-4 font-bold text-2xl">My Schedule</h1>
      <ScheduleWidget
        events={events}
        numberOfDays={7}
        height="700px"
        onEventClick={(event) => {
          // Handle event click
          router.push(`/events/${event.id}`);
        }}
      />
    </div>
  );
}
```

## Event Data Structure

Events follow the standard calendar event format:

```typescript
type CalendarEvent = {
  id: string;                      // Unique identifier
  start: Date;                     // Event start time
  end: Date;                       // Event end time
  title: string;                   // Event title
  color?: "default" | "blue" | "green" | "pink" | "purple" | "red";
  description?: string;            // Optional description
}
```

## Customization

### Changing Number of Days in Schedule View

To change the default number of days shown in the schedule view, edit the `CalendarScheduleView` component in `/src/components/calendar/full-calendar.tsx`:

```tsx
// Line 585-592 in full-calendar.tsx
const scheduleDates = useMemo(() => {
  const dates = [];
  const startDay = date;

  for (let i = 0; i < 3; i++) {  // Change '3' to desired number of days
    const day = addDays(startDay, i);
    dates.push(day);
  }

  return dates;
}, [date]);
```

Also update the navigation to move by the same number of days:

```tsx
// In CalendarNextTrigger (line 832-833)
} else if (view === "schedule") {
  setDate(addDays(date, 3)); // Change to match your day count
}
```

### Styling

The schedule view uses Tailwind CSS classes and can be customized by modifying:

1. **Event colors**: Edit the `dayEventVariants` CVA in `full-calendar.tsx` (lines 61-75)
2. **Layout**: Modify grid and spacing classes in `CalendarScheduleView` (lines 609-811)
3. **Widget styling**: Customize in `schedule-widget.tsx`

## Integration Points

### Current Integrations

1. **Scholarship Calendar**: `/scholarships/calendar` - Full calendar with schedule view
2. **Schedule Widget**: Available as standalone component for embedding

### Future Integration Ideas

1. **Dashboard Widget**: Embed a 3-day schedule widget on the user dashboard
2. **Course Schedule**: Use schedule widget for class timetables
3. **Exam Calendar**: Display exam schedule in schedule view
4. **Assignment Deadlines**: Show upcoming deadlines in a focused schedule view

## Technical Details

### Files Modified

1. `/src/components/calendar/full-calendar.tsx`
   - Added `schedule` to View type (line 77)
   - Added keyboard shortcut `S` for schedule view (lines 150-152)
   - Implemented `CalendarScheduleView` component (lines 581-811)
   - Updated navigation triggers to handle schedule view (lines 832-833, 880-881)
   - Updated `CalendarCurrentDate` to show date ranges (lines 934-949)
   - Exported `CalendarScheduleView` (line 1015)

2. `/src/components/scholarships/scholarship-calendar.tsx`
   - Imported `CalendarScheduleView` (line 81)
   - Added Schedule button to view selector (line 109)
   - Added `CalendarScheduleView` to layout (line 118)

### Files Created

1. `/src/components/calendar/schedule-widget.tsx`
   - Standalone reusable schedule widget component
   - Fully configurable with props
   - Independent navigation state
   - Can be embedded anywhere in the app

## Design Principles

The schedule view follows Google Calendar's design philosophy:

1. **Clarity**: Clean layout with clear visual hierarchy
2. **Context**: Always shows which day you're viewing
3. **Continuity**: Smooth navigation between time periods
4. **Responsiveness**: Events scale properly within their time slots
5. **Accessibility**: Keyboard navigation and proper ARIA labels

## Browser Support

The schedule view works in all modern browsers that support:
- CSS Grid
- CSS Flexbox
- ES2020+ JavaScript features
- React 18+ features

## Performance Considerations

- Events are filtered and memoized for each day to prevent unnecessary recalculations
- Hover cards use lazy loading with `openDelay={300}`
- Time slots are rendered on-demand during scrolling
- Date calculations use efficient `date-fns` functions

## Future Enhancements

Potential improvements for the schedule view:

1. **Drag and Drop**: Allow dragging events to reschedule
2. **Event Creation**: Click on time slots to create new events
3. **Week Numbers**: Show week numbers in headers
4. **Mini Calendar**: Add a mini calendar for quick date navigation
5. **Event Overlaps**: Better handling of overlapping events
6. **Timezone Support**: Display events in user's timezone
7. **Responsive Design**: Optimize for mobile devices
8. **Print Styles**: Add print-friendly layout
