"use client";

import {
  addDays,
  addYears,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  type Locale,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subYears,
} from "date-fns";
import { ChevronLeft, ChevronRight, Filter, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  // CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
  useCalendar,
} from "@/components/calendar/full-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useScholarshipEvents } from "@/hooks/use-scholarships";
import { cn } from "@/lib/utils";

export type EventType =
  | "deadline"
  | "open"
  | "interview"
  | "webinar"
  | "result_announcement";

interface EventTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  description: string;
}

export const eventTypeConfig: Record<EventType, EventTypeConfig> = {
  deadline: {
    label: "Deadline",
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
    description: "Application deadline",
  },
  open: {
    label: "Applications Open",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
    description: "Applications now open",
  },
  interview: {
    label: "Interview",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-800",
    dotColor: "bg-purple-500",
    description: "Interview scheduled",
  },
  webinar: {
    label: "Webinar",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-800",
    dotColor: "bg-blue-500",
    description: "Information session",
  },
  result_announcement: {
    label: "Results",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
    description: "Results announcement",
  },
};

// Extended calendar event type with scholarship-specific fields
interface ScholarshipCalendarEvent {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color: "default" | "blue" | "green" | "pink" | "purple" | "red";
  description?: string;
  scholarshipName?: string;
  roundName?: string | null;
  type: EventType;
  slug?: string;
}

export function ScholarshipCalendar() {
  const router = useRouter();
  const [today] = useState(new Date());
  const start = useMemo(() => subYears(startOfYear(today), 1), [today]);
  const end = useMemo(() => addYears(endOfYear(today), 1), [today]);

  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<EventType[]>([
    "deadline",
    "open",
    "interview",
    "webinar",
    "result_announcement",
  ]);

  const { data: events, isLoading } = useScholarshipEvents(start, end);

  const calendarEvents = useMemo((): ScholarshipCalendarEvent[] => {
    if (!events) return [];
    return events
      .filter((e) => selectedTypes.includes(e.type as EventType))
      .map((e) => ({
        id: e.id,
        start: new Date(e.date),
        end: new Date(e.date),
        title: e.name,
        scholarshipName: e.round?.scholarship?.name,
        roundName: e.round?.roundName,
        color: (e.type === "deadline"
          ? "red"
          : e.type === "open"
            ? "green"
            : e.type === "interview"
              ? "purple"
              : e.type === "webinar"
                ? "blue"
                : e.type === "result_announcement"
                  ? "pink"
                  : "default") as
          | "default"
          | "blue"
          | "green"
          | "pink"
          | "purple"
          | "red",
        description: e.description || undefined,
        type: e.type as EventType,
        slug: e.round?.scholarship?.slug,
      }));
  }, [events, selectedTypes]);

  const toggleEventType = (type: EventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const selectAllTypes = () => {
    setSelectedTypes([
      "deadline",
      "open",
      "interview",
      "webinar",
      "result_announcement",
    ]);
  };

  const clearAllTypes = () => {
    setSelectedTypes([]);
  };

  const activeFilterCount = selectedTypes.length;
  const totalFilterCount = 5;

  return (
    <div className="flex flex-col gap-4">
      {/* Main Calendar Container */}
      <div className="relative min-h-175 rounded-xl border bg-card shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading events...</p>
            </div>
          </div>
        )}
        <Calendar
          events={calendarEvents}
          onEventClick={(event) => {
            const scholarshipEvent = event as ScholarshipCalendarEvent;
            if (scholarshipEvent.slug) {
              router.push(`/scholarships/${scholarshipEvent.slug}`);
            }
          }}
          view="month"
        >
          <div className="flex h-full flex-col">
            <CalendarStandardLayout
              selectedTypes={selectedTypes}
              onToggleType={toggleEventType}
              onSelectAll={selectAllTypes}
              onClearAll={clearAllTypes}
              activeFilterCount={activeFilterCount}
              totalFilterCount={totalFilterCount}
            />
          </div>
        </Calendar>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border bg-card/50 px-4 py-3">
        <span className="text-muted-foreground text-sm">Event types:</span>
        {Object.entries(eventTypeConfig).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full", config.dotColor)} />
            <span className={cn("font-medium text-sm", config.color)}>
              {config.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CalendarStandardLayoutProps {
  selectedTypes: EventType[];
  onToggleType: (type: EventType) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  activeFilterCount: number;
  totalFilterCount: number;
}

function CalendarStandardLayout({
  selectedTypes,
  onToggleType,
  onSelectAll,
  onClearAll,
  activeFilterCount,
  totalFilterCount,
}: CalendarStandardLayoutProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
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

        <div className="flex items-center gap-2">
          {/* Event Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount < totalFilterCount && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}/{totalFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Event Types</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onSelectAll}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={onClearAll}
                  >
                    None
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(eventTypeConfig) as EventType[]).map((type) => {
                const config = eventTypeConfig[type];
                const isSelected = selectedTypes.includes(type);
                return (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={isSelected}
                    onCheckedChange={() => onToggleType(type)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        config.dotColor,
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{config.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {config.description}
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center rounded-md bg-muted p-1">
            <CalendarViewTrigger view="day">Day</CalendarViewTrigger>
            <CalendarViewTrigger view="week">Week</CalendarViewTrigger>
            <CalendarViewTrigger view="month">Month</CalendarViewTrigger>
            <CalendarViewTrigger view="year">Year</CalendarViewTrigger>
          </div>
        </div>
      </div>

      {/* Calendar Views */}
      <div className="flex-1 overflow-auto">
        <CalendarDayView />
        <CalendarWeekView />
        <EnhancedMonthView />
        <CalendarYearView />
      </div>
    </>
  );
}

// Enhanced Month View with better event display
function EnhancedMonthView() {
  const { view, date, events, locale, onEventClick } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "month") return null;

  return (
    <div className="flex h-full flex-col p-2">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-background">
        {weekDays.map((day: string, i: number) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center font-medium text-muted-foreground text-sm",
              [0, 6].includes(i) && "text-muted-foreground/50",
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {monthDates.map((_date: Date, index: number) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date),
          ) as unknown as ScholarshipCalendarEvent[];
          const isCurrentMonth = isSameMonth(date, _date);
          const isWeekend = index % 7 === 0 || index % 7 === 6;

          return (
            <div
              className={cn(
                "relative flex min-h-25 flex-col border-r border-b p-0.5 transition-colors",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground/50",
                isWeekend && isCurrentMonth && "bg-muted/10",
                isToday(_date) && "bg-primary/5",
                index % 7 === 0 && "border-l",
              )}
              key={_date.toString()}
            >
              {/* Date Number */}
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-medium text-sm",
                    isToday(_date) &&
                      "bg-primary font-semibold text-primary-foreground",
                    !isCurrentMonth && "text-muted-foreground/40",
                  )}
                >
                  {format(_date, "d")}
                </span>
              </div>

              {/* Events List - Limited to fit in cell */}
              <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                {currentEvents.slice(0, 2).map((event) => {
                  const config = eventTypeConfig[event.type];
                  return (
                    <HoverCard key={event.id} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onEventClick?.(event)}
                          className={cn(
                            "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors hover:opacity-80",
                            config.bgColor,
                            config.color,
                          )}
                        >
                          <div
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              config.dotColor,
                            )}
                          />
                          <span className="truncate font-medium">
                            {event.title}
                          </span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="top"
                        align="start"
                        className="w-72 p-0"
                      >
                        <div
                          className={cn("border-b px-3 py-2", config.bgColor)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full",
                                config.dotColor,
                              )}
                            />
                            <h4 className="font-semibold text-sm">
                              {event.title}
                            </h4>
                          </div>
                        </div>
                        <div className="space-y-2 p-3">
                          {event.scholarshipName && (
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Scholarship
                              </p>
                              <p className="font-medium text-sm">
                                {event.scholarshipName}
                              </p>
                            </div>
                          )}
                          {event.roundName && (
                            <div>
                              <p className="text-muted-foreground text-xs">
                                Round
                              </p>
                              <p className="text-sm">{event.roundName}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground text-xs">
                              Date
                            </p>
                            <p className="text-sm">
                              {format(event.start, "EEEE, MMMM d, yyyy")}
                            </p>
                          </div>
                          {event.description && (
                            <div className="border-t pt-2">
                              <p className="text-muted-foreground text-xs">
                                Description
                              </p>
                              <p className="text-sm leading-relaxed">
                                {event.description}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t pt-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-xs",
                                config.bgColor,
                                config.color,
                              )}
                            >
                              {config.label}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              Click for details →
                            </span>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
                {/* More Events Indicator */}
                {currentEvents.length > 2 && (
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1 text-left text-muted-foreground text-xs transition-colors hover:bg-muted"
                  >
                    +{currentEvents.length - 2} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Utility functions
const getDaysInMonth = (date: Date): Date[] => {
  const startOfMonthDate = startOfMonth(date);
  const startOfWeekForMonth = startOfWeek(startOfMonthDate, {
    weekStartsOn: 0,
  });

  let currentDate = startOfWeekForMonth;
  const calendar: Date[] = [];

  while (calendar.length < 42) {
    calendar.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return calendar;
};

const generateWeekdays = (locale: Locale) => {
  const daysOfWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), i);
    daysOfWeek.push(format(date, "EEEEEE", { locale }));
  }
  return daysOfWeek;
};
