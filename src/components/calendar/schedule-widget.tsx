"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
  endOfWeek,
  type Locale,
  compareAsc,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Google Calendar-inspired event card variants with saturated colors
const scheduleEventVariants = cva(
  "w-full cursor-pointer rounded-lg px-4 py-3 text-left transition-all hover:opacity-90 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "bg-zinc-600 text-white",
        blue: "bg-sky-500 text-white",
        green: "bg-emerald-500 text-white",
        pink: "bg-pink-400 text-white",
        purple: "bg-violet-400 text-white",
        red: "bg-red-400 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color?: VariantProps<typeof scheduleEventVariants>["variant"];
  description?: string;
};

type ScheduleWidgetProps = HTMLAttributes<HTMLDivElement> & {
  events?: CalendarEvent[];
  defaultDate?: Date;
  locale?: Locale;
  daysToShow?: number;
  height?: string;
  onEventClick?: (event: CalendarEvent) => void;
  showHeader?: boolean;
};

export function ScheduleWidget({
  events: defaultEvents = [],
  defaultDate = new Date(),
  locale = enUS,
  daysToShow = 14, // Show 2 weeks by default for a scrollable list
  height = "100%",
  onEventClick,
  showHeader = true,
  className,
  ...props
}: ScheduleWidgetProps) {
  const [date, setDate] = useState(startOfDay(defaultDate));
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents(defaultEvents);
  }, [defaultEvents]);

  // Scroll to today on mount
  useEffect(() => {
    if (todayRef.current && scrollContainerRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Generate schedule dates
  const scheduleDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < daysToShow; i++) {
      dates.push(addDays(date, i));
    }
    return dates;
  }, [date, daysToShow]);

  // Group events by date and sort by start time
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    scheduleDates.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      const dayEvents = events
        .filter((event) => isSameDay(new Date(event.start), d))
        .sort((a, b) => compareAsc(new Date(a.start), new Date(b.start)));
      grouped.set(key, dayEvents);
    });

    return grouped;
  }, [events, scheduleDates]);

  // Get week range for header
  const getWeekRange = useCallback((currentDate: Date) => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d")}`;
  }, []);

  // Navigation handlers
  const goNext = useCallback(() => {
    setDate(addDays(date, 7));
  }, [date]);

  const goPrev = useCallback(() => {
    setDate(addDays(date, -7));
  }, [date]);

  const goToday = useCallback(() => {
    setDate(startOfDay(new Date()));
    if (todayRef.current && scrollContainerRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Get current month for the header banner
  const currentMonth = useMemo(() => {
    return format(date, "MMMM yyyy");
  }, [date]);

  // Determine if we should show a week separator
  const getWeekSeparator = (currentDate: Date, index: number) => {
    if (index === 0) return getWeekRange(currentDate);
    const prevDate = scheduleDates[index - 1];
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const prevWeekStart = startOfWeek(prevDate, { weekStartsOn: 0 });
    if (!isSameDay(currentWeekStart, prevWeekStart)) {
      return getWeekRange(currentDate);
    }
    return null;
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl bg-neutral-900 text-white",
        className
      )}
      style={{ height }}
      {...props}
    >
      {/* Month Header Banner - Google Calendar Style */}
      {showHeader && (
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="relative h-40 bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-800">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Abstract shapes */}
              <div className="absolute top-8 right-4 h-20 w-32 rounded-full bg-neutral-600/40 blur-xl" />
              <div className="absolute top-12 right-12 h-16 w-24 rounded-full bg-neutral-500/30 blur-lg" />
              {/* Stylized lines */}
              <svg
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-24 opacity-40"
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
              >
                <title>Decorative wave pattern</title>
                <path
                  d="M0,80 C80,60 120,40 200,50 C280,60 320,80 400,70 L400,100 L0,100 Z"
                  fill="currentColor"
                  className="text-teal-800/30"
                />
                <path
                  d="M0,90 C100,70 150,50 250,60 C350,70 380,90 400,85 L400,100 L0,100 Z"
                  fill="currentColor"
                  className="text-emerald-700/20"
                />
              </svg>
            </div>

            {/* Month Title */}
            <div className="relative z-10 flex h-full flex-col justify-end p-6 pb-4">
              <h1 className="font-light text-3xl tracking-wide">{currentMonth}</h1>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 border-b border-neutral-700 bg-neutral-800/80 py-2 px-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={goPrev}
              className="h-8 w-8 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={goNext}
              className="h-8 w-8 text-neutral-300 hover:bg-neutral-700 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToday}
              className="text-neutral-300 text-sm hover:bg-neutral-700 hover:text-white"
            >
              Today
            </Button>
          </div>
        </div>
      )}

      {/* Scrollable Schedule List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        {scheduleDates.map((dayDate, index) => {
          const dateKey = format(dayDate, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(dateKey) || [];
          const weekSeparator = getWeekSeparator(dayDate, index);
          const isTodayDate = isToday(dayDate);

          return (
            <div
              key={dateKey}
              ref={isTodayDate ? todayRef : undefined}
            >
              {/* Week Separator */}
              {weekSeparator && (
                <div className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-900/95 px-4 py-2 backdrop-blur-sm">
                  <span className="font-medium text-neutral-400 text-xs">
                    {weekSeparator}
                  </span>
                </div>
              )}

              {/* Day Row */}
              <div
                className={cn(
                  "flex gap-4 px-4 py-3",
                  isTodayDate && "bg-neutral-800/30"
                )}
              >
                {/* Date Column */}
                <div className="flex w-12 shrink-0 flex-col items-center pt-1">
                  <span className="font-medium text-neutral-400 text-xs">
                    {format(dayDate, "EEE", { locale })}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 items-center justify-center rounded-full font-normal text-2xl",
                      isTodayDate
                        ? "bg-sky-500 text-white"
                        : "text-white"
                    )}
                  >
                    {format(dayDate, "d")}
                  </span>
                </div>

                {/* Events Column */}
                <div className="flex flex-1 flex-col gap-2">
                  {dayEvents.length > 0 ? (
                    dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onEventClick?.(event)}
                        className={cn(scheduleEventVariants({ variant: event.color }))}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="mt-0.5 text-sm opacity-90">
                          {format(new Date(event.start), "h:mm a")} –{" "}
                          {format(new Date(event.end), "h:mm a")}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="py-4" /> // Empty space for days with no events
                  )}
                </div>
              </div>

              {/* Divider between days */}
              {dayEvents.length > 0 && (
                <div className="border-b border-neutral-800 ml-16" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
