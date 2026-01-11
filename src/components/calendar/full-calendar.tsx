"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInMinutes,
  format,
  getMonth,
  isSameDay,
  isSameHour,
  isSameMonth,
  isToday,
  type Locale,
  setHours,
  setMonth,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

const monthEventVariants = cva("size-2 rounded-full", {
  variants: {
    variant: {
      default: "bg-primary",
      blue: "bg-blue-500",
      green: "bg-green-500",
      pink: "bg-pink-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const dayEventVariants = cva("rounded border-l-4 p-0.5 font-bold text-xs", {
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

type View = "day" | "week" | "month" | "year";

type ContextType = {
  view: View;
  setView: (view: View) => void;
  date: Date;
  setDate: (date: Date) => void;
  events: CalendarEvent[];
  locale: Locale;
  setEvents: (date: CalendarEvent[]) => void;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
  enableHotkeys?: boolean;
  today: Date;
};

const Context = createContext<ContextType>({} as ContextType);

export type CalendarEvent = {
  id: string;
  start: Date;
  end: Date;
  title: string;
  color?: VariantProps<typeof monthEventVariants>["variant"];
  description?: string;
};

type CalendarProps = {
  children: ReactNode;
  defaultDate?: Date;
  events?: CalendarEvent[];
  view?: View;
  locale?: Locale;
  enableHotkeys?: boolean;
  onChangeView?: (view: View) => void;
  onEventClick?: (event: CalendarEvent) => void;
};

const Calendar = ({
  children,
  defaultDate = new Date(),
  locale = enUS,
  enableHotkeys = true,
  view: _defaultMode = "month",
  onEventClick,
  events: defaultEvents = [],
  onChangeView,
}: CalendarProps) => {
  const [view, setView] = useState<View>(_defaultMode);
  const [date, setDate] = useState(defaultDate);
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);

  const changeView = (view: View) => {
    setView(view);
    onChangeView?.(view);
  };

  useHotkeys("m", () => changeView("month"), {
    enabled: enableHotkeys,
  });

  useHotkeys("w", () => changeView("week"), {
    enabled: enableHotkeys,
  });

  useHotkeys("y", () => changeView("year"), {
    enabled: enableHotkeys,
  });

  useHotkeys("d", () => changeView("day"), {
    enabled: enableHotkeys,
  });

  useEffect(() => {
    setEvents(defaultEvents);
  }, [defaultEvents]);

  return (
    <Context.Provider
      value={{
        view,
        setView,
        date,
        setDate,
        events,
        setEvents,
        locale,
        enableHotkeys,
        onEventClick,
        onChangeView,
        today: new Date(),
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useCalendar = () => useContext(Context);

type CalendarViewTriggerProps = React.HTMLAttributes<HTMLButtonElement> & {
  view: View;
};

const CalendarViewTrigger = ({
  children,
  view,
  ...props
}: CalendarViewTriggerProps) => {
  const { view: currentView, setView, onChangeView } = useCalendar();

  return (
    <Button
      aria-current={currentView === view}
      size="sm"
      variant="ghost"
      {...props}
      onClick={() => {
        setView(view);
        onChangeView?.(view);
      }}
    >
      {children}
    </Button>
  );
};

const EventGroup = ({
  events,
  hour,
}: {
  events: CalendarEvent[];
  hour: Date;
}) => {
  const { onEventClick } = useCalendar();

  return (
    <div className="relative h-20 border-t last:border-b">
      {events
        .filter((event) => isSameHour(event.start, hour))
        .map((event) => {
          const hoursDifference = Math.max(
            differenceInMinutes(event.end, event.start) / 60,
            0.25
          );
          const startPosition = event.start.getMinutes() / 60;

          return (
            <HoverCard key={event.id} openDelay={300}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "absolute line-clamp-1 w-full rounded-sm px-1 text-left text-xs",
                    dayEventVariants({ variant: event.color })
                  )}
                  style={{
                    top: `${startPosition * 100}%`,
                    height: `${hoursDifference * 100}%`,
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  {event.title}
                </button>
              </HoverCardTrigger>

              <HoverCardContent
                side="top"
                align="center"
                className="w-64 text-sm"
              >
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>

                  <p className="text-muted-foreground">
                    {format(event.start, "p")} – {format(event.end, "p")}
                  </p>

                  {event.description && (
                    <p className="text-muted-foreground leading-snug">
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
};

const CalendarDayView = () => {
  const { view, events, date } = useCalendar();

  if (view !== "day") return null;

  const hours = [...Array(24)].map((_, i) => setHours(date, i));

  return (
    <div className="relative flex h-full pt-2">
      <TimeTable />
      <div className="flex-1">
        {hours.map((hour) => (
          <EventGroup key={hour.toString()} hour={hour} events={events} />
        ))}
      </div>
    </div>
  );
};

const CalendarWeekView = () => {
  const { view, date, locale, events } = useCalendar();

  const weekDates = useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn: 0 });
    const weekDates = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const hours = [...Array(24)].map((_, i) => setHours(day, i));
      weekDates.push(hours);
    }

    return weekDates;
  }, [date]);

  const headerDays = useMemo(() => {
    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
      const result = addDays(startOfWeek(date, { weekStartsOn: 0 }), i);
      daysOfWeek.push(result);
    }
    return daysOfWeek;
  }, [date]);

  if (view !== "week") return null;

  return (
    <div className="relative flex h-full flex-col overflow-y-auto sm:overflow-x-hidden">
      <div className="sticky top-0 z-10 mb-3 flex min-w-140 border-b bg-card">
        <div className="w-12"></div>
        {headerDays.map((date, i) => (
          <div
            key={date.toString()}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 pb-2 text-center text-muted-foreground text-sm",
              [0, 6].includes(i) && "text-muted-foreground/50"
            )}
          >
            {format(date, "E", { locale })}
            <span
              className={cn(
                "grid h-6 place-content-center",
                isToday(date) &&
                  "size-6 rounded-full bg-primary text-primary-foreground"
              )}
            >
              {format(date, "d")}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1">
        <div className="sticky left-0 z-10 w-12 shrink-0 bg-background">
          <TimeTable />
        </div>
        <div className="grid min-w-125 flex-1 grid-cols-7 divide-x">
          {weekDates.map((hours, i) => {
            return (
              <div
                className={cn(
                  "h-full border-l text-muted-foreground text-sm first:border-l-0",
                  [0, 6].includes(i) && "bg-muted/50"
                )}
                key={hours[0].toString()}
              >
                {hours.map((hour) => (
                  <EventGroup
                    key={hour.toString()}
                    hour={hour}
                    events={events}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CalendarMonthView = () => {
  const { date, view, events, locale, onEventClick } = useCalendar();

  const monthDates = useMemo(() => getDaysInMonth(date), [date]);
  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "month") return null;

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 grid grid-cols-7 gap-px border-b bg-background">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "mb-2 pr-2 text-right text-muted-foreground text-sm",
              [0, 6].includes(i) && "text-muted-foreground/50"
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="-mt-px grid flex-1 auto-rows-fr grid-cols-7 gap-px overflow-hidden p-px">
        {monthDates.map((_date) => {
          const currentEvents = events.filter((event) =>
            isSameDay(event.start, _date)
          );

          return (
            <div
              className={cn(
                "overflow-auto p-2 text-muted-foreground text-sm ring-1 ring-border",
                !isSameMonth(date, _date) && "text-muted-foreground/50"
              )}
              key={_date.toString()}
            >
              <span
                className={cn(
                  "sticky top-0 mb-1 grid size-6 place-items-center rounded-full",
                  isToday(_date) && "bg-primary text-primary-foreground"
                )}
              >
                {format(_date, "d")}
              </span>

              {currentEvents.map((event) => {
                return (
                  <HoverCard key={event.id}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-1 rounded px-1 text-left text-sm transition-colors hover:bg-muted"
                        onClick={() => onEventClick?.(event)}
                      >
                        <div
                          className={cn(
                            "shrink-0",
                            monthEventVariants({ variant: event.color })
                          )}
                        ></div>
                        <span className="flex-1 truncate">{event.title}</span>
                        <time className="text-muted-foreground/50 text-xs tabular-nums">
                          {format(event.start, "HH:mm")}
                        </time>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 shadow-lg" side="top">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "size-2 rounded-full",
                              monthEventVariants({ variant: event.color })
                            )}
                          ></div>
                          <h4 className="font-semibold text-sm">
                            {event.title}
                          </h4>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {format(event.start, "PPP p")} (UTC)
                        </p>
                        {event.description && (
                          <p className="border-t pt-2 text-xs">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-2 text-[10px] text-muted-foreground italic">
                          Click to view details
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarYearView = () => {
  const { view, date, today, locale, events, setDate, setView } = useCalendar();

  const months = useMemo(() => {
    if (!view) {
      return [];
    }

    return Array.from({ length: 12 }).map((_, i) => {
      return getDaysInMonth(setMonth(date, i));
    });
  }, [date, view]);

  const weekDays = useMemo(() => generateWeekdays(locale), [locale]);

  if (view !== "year") return null;

  return (
    <div className="grid h-full grid-cols-1 gap-10 overflow-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((days, i) => (
        <div key={days[0].toString()} className="flex flex-col">
          <button
            type="button"
            className="w-fit font-semibold text-lg transition-colors hover:text-primary"
            onClick={() => {
              setDate(setMonth(date, i));
              setView("month");
            }}
          >
            {format(setMonth(new Date(), i), "MMMM")}
          </button>

          <div className="my-5 grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-muted-foreground text-xs"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-x-2 gap-y-1 text-center text-xs tabular-nums">
            {days.map((_date) => {
              const isCurrentMonth = getMonth(_date) === i;
              const hasEvents = events.some((event) =>
                isSameDay(event.start, _date)
              );

              return (
                <div
                  key={_date.toString()}
                  className={cn(
                    "relative flex flex-col items-center gap-1",
                    !isCurrentMonth && "text-muted-foreground/30"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDate(_date);
                      setView("day");
                    }}
                    className={cn(
                      "grid aspect-square size-7 place-content-center rounded-full tabular-nums transition-colors hover:bg-primary/20",
                      isSameDay(today, _date) &&
                        isCurrentMonth &&
                        "bg-primary text-primary-foreground",
                      hasEvents &&
                        isCurrentMonth &&
                        !isSameDay(today, _date) &&
                        "bg-primary/20 font-bold text-primary"
                    )}
                  >
                    {format(_date, "d")}
                  </button>
                  {hasEvents && isCurrentMonth && (
                    <div className="flex gap-0.5">
                      {events
                        .filter((e) => isSameDay(e.start, _date))
                        .slice(0, 3)
                        .map((e) => (
                          <div
                            key={e.id}
                            className={cn(
                              "size-1 rounded-full",
                              monthEventVariants({ variant: e.color })
                            )}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const CalendarNextTrigger = ({
  children,
  onClick,
  ref,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  const next = useCallback(() => {
    if (view === "day") {
      setDate(addDays(date, 1));
    } else if (view === "week") {
      setDate(addWeeks(date, 1));
    } else if (view === "month") {
      setDate(addMonths(date, 1));
    } else if (view === "year") {
      setDate(addYears(date, 1));
    }
  }, [date, view, setDate]);

  useHotkeys("ArrowRight", () => next(), {
    enabled: enableHotkeys,
  });

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        next();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
};

const CalendarPrevTrigger = ({
  children,
  onClick,
  ref,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const { date, setDate, view, enableHotkeys } = useCalendar();

  useHotkeys("ArrowLeft", () => prev(), {
    enabled: enableHotkeys,
  });

  const prev = useCallback(() => {
    if (view === "day") {
      setDate(subDays(date, 1));
    } else if (view === "week") {
      setDate(subWeeks(date, 1));
    } else if (view === "month") {
      setDate(subMonths(date, 1));
    } else if (view === "year") {
      setDate(subYears(date, 1));
    }
  }, [date, view, setDate]);

  return (
    <Button
      size="icon"
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        prev();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
};

const CalendarTodayTrigger = ({
  children,
  onClick,
  ref,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  ref?: React.Ref<HTMLButtonElement>;
}) => {
  const { setDate, enableHotkeys, today } = useCalendar();

  useHotkeys("t", () => jumpToToday(), {
    enabled: enableHotkeys,
  });

  const jumpToToday = useCallback(() => {
    setDate(today);
  }, [today, setDate]);

  return (
    <Button
      variant="outline"
      ref={ref}
      {...props}
      onClick={(e) => {
        jumpToToday();
        onClick?.(e);
      }}
    >
      {children}
    </Button>
  );
};

const CalendarCurrentDate = () => {
  const { date, view } = useCalendar();

  return (
    <time className="tabular-nums">
      {format(date, view === "day" ? "dd MMMM yyyy" : "MMMM yyyy")}
    </time>
  );
};

const TimeTable = () => {
  const now = new Date();

  return (
    <div className="w-12 pr-2">
      {Array.from(Array(25).keys()).map((hour) => {
        return (
          <div
            className="relative h-20 text-right text-muted-foreground/50 text-xs last:h-0"
            key={hour}
          >
            {now.getHours() === hour && (
              <div
                className="z- absolute left-full h-0.5 w-dvw translate-x-2 bg-red-500"
                style={{
                  top: `${(now.getMinutes() / 60) * 100}%`,
                }}
              >
                <div className="absolute top-1/2 left-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500"></div>
              </div>
            )}
            <p className="top-0 -translate-y-1/2">
              {hour === 24 ? 0 : hour}:00
            </p>
          </div>
        );
      })}
    </div>
  );
};

const getDaysInMonth = (date: Date) => {
  const startOfMonthDate = startOfMonth(date);
  const startOfWeekForMonth = startOfWeek(startOfMonthDate, {
    weekStartsOn: 0,
  });

  let currentDate = startOfWeekForMonth;
  const calendar = [];

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

export {
  Calendar,
  CalendarCurrentDate,
  CalendarDayView,
  CalendarMonthView,
  CalendarNextTrigger,
  CalendarPrevTrigger,
  CalendarTodayTrigger,
  CalendarViewTrigger,
  CalendarWeekView,
  CalendarYearView,
};
