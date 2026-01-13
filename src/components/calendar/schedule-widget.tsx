"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  addDays,
  differenceInMinutes,
  format,
  isSameDay,
  isSameHour,
  isToday,
  setHours,
  type Locale,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  type HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const eventVariants = cva("rounded border-l-4 p-2 font-semibold text-xs", {
  variants: {
    variant: {
      default: "border-muted bg-muted/30 text-muted-foreground",
      blue: "border-blue-500 bg-blue-500/30 text-blue-600",
      green: "border-green-500 bg-green-500/30 text-green-600",
      pink: "border-pink-500 bg-pink-500/30 text-pink-600",
      purple: "border-purple-500 bg-purple-500/30 text-purple-600",
      red: "border-red-500 bg-red-500/30 text-red-600",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color?: VariantProps<typeof eventVariants>["variant"];
  description?: string;
};

type ScheduleWidgetProps = HTMLAttributes<HTMLDivElement> & {
  events?: CalendarEvent[];
  defaultDate?: Date;
  locale?: Locale;
  numberOfDays?: 3 | 5 | 7;
  height?: string;
  onEventClick?: (event: CalendarEvent) => void;
  showHeader?: boolean;
  showAllDaySection?: boolean;
};

export function ScheduleWidget({
  events: defaultEvents = [],
  defaultDate = new Date(),
  locale = enUS,
  numberOfDays = 3,
  height = "600px",
  onEventClick,
  showHeader = true,
  showAllDaySection = true,
  className,
  ...props
}: ScheduleWidgetProps) {
  const [date, setDate] = useState(defaultDate);
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);

  useEffect(() => {
    setEvents(defaultEvents);
  }, [defaultEvents]);

  // Generate schedule dates
  const scheduleDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < numberOfDays; i++) {
      const day = addDays(date, i);
      dates.push(day);
    }
    return dates;
  }, [date, numberOfDays]);

  // Check if event is all-day
  const isAllDayEvent = useCallback((event: CalendarEvent) => {
    const hoursDuration = differenceInMinutes(event.end, event.start) / 60;
    return hoursDuration >= 23;
  }, []);

  // Navigation handlers
  const goNext = useCallback(() => {
    setDate(addDays(date, numberOfDays));
  }, [date, numberOfDays]);

  const goPrev = useCallback(() => {
    setDate(addDays(date, -numberOfDays));
  }, [date, numberOfDays]);

  const goToday = useCallback(() => {
    setDate(new Date());
  }, []);

  // Format date range for header
  const formatRange = useCallback(() => {
    const endDate = addDays(date, numberOfDays - 1);
    if (format(date, "MMM yyyy", { locale }) ===
        format(endDate, "MMM yyyy", { locale })) {
      return `${format(date, "MMM d", { locale })} – ${format(endDate, "d, yyyy", { locale })}`;
    }
    return `${format(date, "MMM d", { locale })} – ${format(endDate, "MMM d, yyyy", { locale })}`;
  }, [date, numberOfDays, locale]);

  return (
    <div
      className={cn("flex flex-col rounded-lg border bg-card", className)}
      style={{ height }}
      {...props}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={goPrev}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={goNext}>
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" onClick={goToday}>
              Today
            </Button>
            <h3 className="font-semibold text-lg">{formatRange()}</h3>
          </div>
        </div>
      )}

      {/* Schedule content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Day headers */}
        <div className="flex border-b bg-muted/30">
          <div className="sticky left-0 z-20 w-16 shrink-0 border-r bg-background"></div>
          <div className="flex flex-1">
            {scheduleDates.map((dayDate) => {
              const dayEvents = events.filter((event) =>
                isSameDay(event.start, dayDate),
              );
              const allDayEvents = dayEvents.filter(isAllDayEvent);

              return (
                <div
                  key={dayDate.toString()}
                  className="flex min-w-64 flex-1 flex-col border-r p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {format(dayDate, "EEE", { locale })}
                      </span>
                      <span
                        className={cn(
                          "grid h-7 w-7 place-content-center rounded-full text-sm font-bold",
                          isToday(dayDate)
                            ? "bg-primary text-primary-foreground"
                            : "",
                        )}
                      >
                        {format(dayDate, "d")}
                      </span>
                    </div>
                    {isToday(dayDate) && (
                      <span className="text-muted-foreground text-xs font-medium">
                        Today
                      </span>
                    )}
                  </div>

                  {/* All-day events */}
                  {showAllDaySection && allDayEvents.length > 0 && (
                    <div className="space-y-1">
                      {allDayEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          className={cn(
                            "w-full rounded px-2 py-1 text-left text-xs",
                            eventVariants({ variant: event.color }),
                          )}
                          onClick={() => onEventClick?.(event)}
                        >
                          {event.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule grid */}
        <div className="flex flex-1 overflow-y-auto">
          {/* Time axis */}
          <div className="sticky left-0 z-20 w-16 shrink-0 border-r bg-background">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                className="relative h-20 border-t text-right text-muted-foreground/50 text-xs last:border-b"
                key={hour}
              >
                <p className="relative top-0 -translate-y-1/2">
                  {hour === 24 ? 0 : hour}:00
                </p>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {scheduleDates.map((dayDate) => {
              const now = new Date();
              const dayEvents = events.filter((event) =>
                isSameDay(event.start, dayDate),
              );
              const timedEvents = dayEvents.filter(
                (e) => !isAllDayEvent(e),
              );

              return (
                <div
                  key={dayDate.toString()}
                  className="relative min-w-64 flex-1 border-r last:border-r-0"
                >
                  {/* Current time indicator */}
                  {isToday(dayDate) && (
                    <div
                      className="absolute z-10 w-full border-t-2 border-red-500"
                      style={{
                        top: `${
                          (now.getHours() * 60 + now.getMinutes()) / 1440
                        }*100%`,
                      }}
                    >
                      <div className="absolute top-1/2 left-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-500 bg-background"></div>
                    </div>
                  )}

                  {/* Time slots */}
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const hourDate = setHours(dayDate, hour);
                    const hourEvents = timedEvents.filter((event) =>
                      isSameHour(event.start, hourDate),
                    );

                    return (
                      <div
                        key={hour}
                        className="relative h-20 border-t last:border-b"
                      >
                        {hourEvents.map((event) => {
                          const hoursDifference = Math.max(
                            differenceInMinutes(event.end, event.start) / 60,
                            0.25,
                          );
                          const startPosition = event.start.getMinutes() / 60;

                          return (
                            <HoverCard key={event.id} openDelay={300}>
                              <HoverCardTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    "absolute left-1 right-1 line-clamp-2 rounded px-2 py-1 text-left text-xs transition-colors hover:opacity-80",
                                    eventVariants({ variant: event.color }),
                                  )}
                                  style={{
                                    top: `${startPosition * 100}%`,
                                    height: `${hoursDifference * 100}%`,
                                  }}
                                  onClick={() => onEventClick?.(event)}
                                >
                                  <div className="font-semibold">
                                    {event.title}
                                  </div>
                                  {hoursDifference >= 1 && (
                                    <div className="text-muted-foreground text-[10px]">
                                      {format(event.start, "p")} –{" "}
                                      {format(event.end, "p")}
                                    </div>
                                  )}
                                </button>
                              </HoverCardTrigger>
                              <HoverCardContent
                                side="right"
                                align="start"
                                className="w-72 text-sm"
                              >
                                <div className="space-y-2">
                                  <p className="font-semibold">
                                    {event.title}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {format(event.start, "PPP p")} –{" "}
                                    {format(event.end, "p")}
                                  </p>
                                  {event.description && (
                                    <p className="text-muted-foreground mt-2 text-xs leading-snug">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
