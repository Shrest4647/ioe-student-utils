"use client";

import { addYears, endOfYear, startOfYear, subYears } from "date-fns";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar } from "@/components/calendar/full-calendar";
import { useScholarshipEvents } from "@/hooks/use-scholarships";

export function ScholarshipCalendar() {
  const router = useRouter();
  // Fetch a wide range of events (e.g., current year +/- 1 year) relative to "today"
  // to avoid complex refetching on every month change for now.
  const [today] = useState(new Date());
  const start = useMemo(() => subYears(startOfYear(today), 1), [today]);
  const end = useMemo(() => addYears(endOfYear(today), 1), [today]);

  const { data: events, isLoading } = useScholarshipEvents(start, end);

  const calendarEvents = useMemo(() => {
    if (!events) return [];
    return events.map((e) => ({
      id: e.id,
      start: new Date(e.date),
      end: new Date(e.date),
      title: `${e.round?.scholarship?.name || "Scholarship"} - ${e.name}`,
      color: (e.type === "deadline"
        ? "red"
        : e.type === "interview"
          ? "purple"
          : e.type === "webinar"
            ? "blue"
            : "green") as any,
      description: e.description || e.round?.roundName || undefined,
    }));
  }, [events]);

  return (
    <div className="relative h-150 rounded-lg border bg-card p-4 shadow-sm">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Calendar
        events={calendarEvents}
        onEventClick={(event) => {
          const original = events?.find((e) => e.id === event.id);
          if (original?.round?.scholarship?.slug) {
            router.push(`/scholarships/${original.round.scholarship.slug}`);
          }
        }}
        view="month"
      >
        <div className="flex h-full flex-col">
          {/* Custom Header could go here using CalendarViewTrigger etc. if needed, 
                   but Calendar component seems to include some default structure or expects children to define it.
                   Wait, looking at full-calendar.tsx, children must define the layout using Context.
               */}
          {/* 
                  Actually, looking at full-calendar.tsx: 
                  It provides Context, and children must use it to render views.
                  I need to copy the structure from a usage example or rebuild a standard layout properties.
                  
                  Let's use a standard layout combining the exported sub-components.
               */}
          <CalendarStandardLayout />
        </div>
      </Calendar>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarScheduleView,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
} from "@/components/calendar/full-calendar";

function CalendarStandardLayout() {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarPrevTrigger>
            <ChevronLeft className="h-4 w-4" />
          </CalendarPrevTrigger>

          <CalendarTodayTrigger>Today</CalendarTodayTrigger>

          <CalendarNextTrigger>
            <ChevronRight className="h-4 w-4" />
          </CalendarNextTrigger>

          <span className="ml-4 font-bold text-xl">
            <CalendarCurrentDate />
          </span>
        </div>

        <div className="flex items-center rounded-md bg-muted p-1">
          <CalendarViewTrigger view="schedule">Schedule</CalendarViewTrigger>
          <CalendarViewTrigger view="day">Day</CalendarViewTrigger>
          <CalendarViewTrigger view="week">Week</CalendarViewTrigger>
          <CalendarViewTrigger view="month">Month</CalendarViewTrigger>
          <CalendarViewTrigger view="year">Year</CalendarViewTrigger>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CalendarScheduleView />
        <CalendarDayView />
        <CalendarWeekView />
        <CalendarMonthView />
        <CalendarYearView />
      </div>
    </>
  );
}
