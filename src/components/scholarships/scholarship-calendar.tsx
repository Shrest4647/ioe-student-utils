"use client";

import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfYear,
  format,
  getMonth,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subYears,
} from "date-fns";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ListFilter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useScholarshipEvents } from "@/hooks/use-scholarships";
import { cn } from "@/lib/utils";

export type EventType =
  | "deadline"
  | "open"
  | "interview"
  | "webinar"
  | "result_announcement";

type CalendarView = "month" | "year" | "agenda";
type DateScope = "all" | "upcoming" | "next-30" | "past";

interface EventTypeConfig {
  label: string;
  shortLabel: string;
  dotColor: string;
  tintColor: string;
  textColor: string;
}

export const eventTypeConfig: Record<EventType, EventTypeConfig> = {
  deadline: {
    label: "Application deadline",
    shortLabel: "Deadline",
    dotColor: "bg-calendar-deadline",
    tintColor: "bg-calendar-deadline/12",
    textColor: "text-calendar-deadline",
  },
  open: {
    label: "Applications open",
    shortLabel: "Opens",
    dotColor: "bg-calendar-open",
    tintColor: "bg-calendar-open/12",
    textColor: "text-calendar-open",
  },
  interview: {
    label: "Interview",
    shortLabel: "Interview",
    dotColor: "bg-calendar-interview",
    tintColor: "bg-calendar-interview/12",
    textColor: "text-calendar-interview",
  },
  webinar: {
    label: "Information session",
    shortLabel: "Webinar",
    dotColor: "bg-calendar-webinar",
    tintColor: "bg-calendar-webinar/12",
    textColor: "text-calendar-webinar",
  },
  result_announcement: {
    label: "Results announced",
    shortLabel: "Results",
    dotColor: "bg-calendar-result",
    tintColor: "bg-calendar-result/12",
    textColor: "text-calendar-result",
  },
};

const allEventTypes = Object.keys(eventTypeConfig) as EventType[];

interface ScholarshipCalendarEvent {
  id: string;
  date: Date;
  title: string;
  description?: string;
  scholarshipName: string;
  roundName?: string | null;
  type: EventType;
  slug?: string;
}

export function ScholarshipCalendar() {
  const router = useRouter();
  const [today] = useState(() => startOfDay(new Date()));
  const rangeStart = useMemo(() => subYears(startOfYear(today), 1), [today]);
  const rangeEnd = useMemo(() => addYears(endOfYear(today), 1), [today]);
  const { data, isError, isLoading, refetch } = useScholarshipEvents(
    rangeStart,
    rangeEnd,
  );

  const [view, setView] = useState<CalendarView>("month");
  const [date, setDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedTypes, setSelectedTypes] =
    useState<EventType[]>(allEventTypes);
  const [dateScope, setDateScope] = useState<DateScope>("all");

  const events = useMemo<ScholarshipCalendarEvent[]>(() => {
    if (!data) return [];

    return data.map((event) => ({
      id: event.id,
      date: new Date(event.date),
      title: event.name,
      description: event.description || undefined,
      scholarshipName: event.round?.scholarship?.name || event.name,
      roundName: event.round?.roundName,
      type: event.type as EventType,
      slug: event.round?.scholarship?.slug,
    }));
  }, [data]);

  const filteredEvents = useMemo(() => {
    const query = deferredSearch.trim().toLocaleLowerCase();
    const inThirtyDays = addDays(today, 30);

    return events.filter((event) => {
      if (!selectedTypes.includes(event.type)) return false;

      if (dateScope === "upcoming" && event.date < today) return false;
      if (
        dateScope === "next-30" &&
        (event.date < today || event.date > inThirtyDays)
      ) {
        return false;
      }
      if (dateScope === "past" && event.date >= today) return false;

      if (!query) return true;
      return [
        event.title,
        event.scholarshipName,
        event.roundName,
        event.description,
        eventTypeConfig[event.type].label,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [dateScope, deferredSearch, events, selectedTypes, today]);

  const activeFilterCount =
    (selectedTypes.length < allEventTypes.length ? 1 : 0) +
    (dateScope !== "all" ? 1 : 0);
  const hasFilters = activeFilterCount > 0 || search.length > 0;

  const resetFilters = () => {
    setSearch("");
    setSelectedTypes(allEventTypes);
    setDateScope("all");
  };

  const openEvent = (event: ScholarshipCalendarEvent) => {
    if (event.slug) router.push(`/scholarships/${event.slug}`);
  };

  if (isLoading) return <CalendarSkeleton />;

  if (isError) {
    return (
      <div className="flex min-h-100 flex-col items-center justify-center gap-3 rounded-xl border bg-card px-6 text-center">
        <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <CalendarDays className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">The calendar could not be loaded</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Check your connection and try again.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RotateCcw /> Try again
        </Button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <CalendarToolbar
        activeFilterCount={activeFilterCount}
        date={date}
        dateScope={dateScope}
        eventCount={filteredEvents.length}
        events={events}
        onDateScopeChange={setDateScope}
        onNavigate={(direction) => {
          setSelectedDate(null);
          setDate((current) =>
            view === "year"
              ? addYears(current, direction)
              : addMonths(current, direction),
          );
        }}
        onReset={resetFilters}
        onSearchChange={setSearch}
        onToday={() => {
          setDate(today);
          setSelectedDate(today);
        }}
        onToggleType={(type) => {
          setSelectedTypes((current) =>
            current.includes(type)
              ? current.filter((item) => item !== type)
              : [...current, type],
          );
        }}
        onViewChange={(nextView) => {
          setView(nextView);
          setSelectedDate(null);
        }}
        search={search}
        selectedTypes={selectedTypes}
        view={view}
      />

      <div
        className={cn(
          "min-h-155",
          view !== "agenda" &&
            "xl:grid xl:grid-cols-[minmax(0,1fr)_22rem] xl:divide-x",
        )}
      >
        <main className="min-w-0">
          {view === "month" && (
            <MonthView
              date={date}
              events={filteredEvents}
              onEventClick={openEvent}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          )}
          {view === "year" && (
            <YearView
              date={date}
              events={filteredEvents}
              onEventClick={openEvent}
              onOpenMonth={(nextDate) => {
                setDate(nextDate);
                setSelectedDate(nextDate);
                setView("month");
              }}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              events={filteredEvents}
              hasFilters={hasFilters}
              key={`${deferredSearch}-${dateScope}-${selectedTypes.join("-")}`}
              onEventClick={openEvent}
              onReset={resetFilters}
              today={today}
            />
          )}
        </main>

        {view !== "agenda" && (
          <EventRail
            date={date}
            events={filteredEvents}
            onClearDate={() => setSelectedDate(null)}
            onEventClick={openEvent}
            selectedDate={selectedDate}
            today={today}
          />
        )}
      </div>
    </section>
  );
}

interface CalendarToolbarProps {
  activeFilterCount: number;
  date: Date;
  dateScope: DateScope;
  eventCount: number;
  events: ScholarshipCalendarEvent[];
  onDateScopeChange: (scope: DateScope) => void;
  onNavigate: (direction: -1 | 1) => void;
  onReset: () => void;
  onSearchChange: (value: string) => void;
  onToday: () => void;
  onToggleType: (type: EventType) => void;
  onViewChange: (view: CalendarView) => void;
  search: string;
  selectedTypes: EventType[];
  view: CalendarView;
}

function CalendarToolbar({
  activeFilterCount,
  date,
  dateScope,
  eventCount,
  events,
  onDateScopeChange,
  onNavigate,
  onReset,
  onSearchChange,
  onToday,
  onToggleType,
  onViewChange,
  search,
  selectedTypes,
  view,
}: CalendarToolbarProps) {
  const typeCounts = useMemo(
    () =>
      allEventTypes.reduce<Record<EventType, number>>(
        (counts, type) => {
          counts[type] = events.filter((event) => event.type === type).length;
          return counts;
        },
        {
          deadline: 0,
          open: 0,
          interview: 0,
          webinar: 0,
          result_announcement: 0,
        },
      ),
    [events],
  );

  return (
    <header className="border-b bg-card">
      <div className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              aria-label="Previous period"
              onClick={() => onNavigate(-1)}
              size="icon-lg"
              variant="ghost"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Next period"
              onClick={() => onNavigate(1)}
              size="icon-lg"
              variant="ghost"
            >
              <ChevronRight />
            </Button>
            <Button onClick={onToday} size="lg" variant="outline">
              Today
            </Button>
          </div>

          <h2 className="min-w-36 flex-1 font-semibold text-lg tracking-tight sm:text-xl">
            {view === "year" ? format(date, "yyyy") : format(date, "MMMM yyyy")}
          </h2>

          <div className="order-last flex w-full items-center rounded-lg bg-muted p-1 sm:order-none sm:w-auto">
            <ViewButton
              active={view === "month"}
              onClick={() => onViewChange("month")}
            >
              Month
            </ViewButton>
            <ViewButton
              active={view === "year"}
              onClick={() => onViewChange("year")}
            >
              Year
            </ViewButton>
            <ViewButton
              active={view === "agenda"}
              onClick={() => onViewChange("agenda")}
            >
              Agenda
            </ViewButton>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1 lg:max-w-xl">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search scholarship events"
              className="h-9 bg-background pr-9 pl-9 text-sm"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search scholarships, rounds, or event types"
              value={search}
            />
            {search && (
              <Button
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => onSearchChange("")}
                size="icon-sm"
                variant="ghost"
              >
                <X />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button className="h-9 gap-2" variant="outline">
                  <Filter />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="min-w-5 px-1.5" variant="secondary">
                      {activeFilterCount}
                    </Badge>
                  )}
                  <ChevronDown className="text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 gap-0 p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm">Filter events</p>
                    <p className="text-muted-foreground text-xs">
                      {eventCount} matching events
                    </p>
                  </div>
                  <Button onClick={onReset} size="sm" variant="ghost">
                    Reset
                  </Button>
                </div>

                <fieldset className="p-4">
                  <legend className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Event type
                  </legend>
                  <div className="space-y-1">
                    {allEventTypes.map((type) => {
                      const config = eventTypeConfig[type];
                      return (
                        <label
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                          htmlFor={`calendar-filter-${type}`}
                          key={type}
                        >
                          <Checkbox
                            checked={selectedTypes.includes(type)}
                            id={`calendar-filter-${type}`}
                            onCheckedChange={() => onToggleType(type)}
                          />
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              config.dotColor,
                            )}
                          />
                          <span className="flex-1 text-sm">{config.label}</span>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {typeCounts[type]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="border-t p-4">
                  <legend className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Date
                  </legend>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        ["all", "All dates"],
                        ["upcoming", "Upcoming"],
                        ["next-30", "Next 30 days"],
                        ["past", "Past"],
                      ] as const
                    ).map(([scope, label]) => (
                      <button
                        className={cn(
                          "flex h-8 items-center justify-between rounded-md px-2 text-left text-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          dateScope === scope && "bg-muted font-medium",
                        )}
                        key={scope}
                        onClick={() => onDateScopeChange(scope)}
                        type="button"
                      >
                        {label}
                        {dateScope === scope && (
                          <Check className="size-3.5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </PopoverContent>
            </Popover>

            {(activeFilterCount > 0 || search) && (
              <Button className="h-9" onClick={onReset} variant="ghost">
                Clear
              </Button>
            )}

            <span className="ml-auto whitespace-nowrap text-muted-foreground text-xs tabular-nums">
              {eventCount} {eventCount === 1 ? "event" : "events"}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex gap-4 overflow-x-auto border-t px-4 py-2"
        aria-label="Event type legend"
      >
        {allEventTypes.map((type) => {
          const config = eventTypeConfig[type];
          const enabled = selectedTypes.includes(type);
          return (
            <button
              aria-pressed={enabled}
              className={cn(
                "flex shrink-0 items-center gap-1.5 text-xs transition-opacity",
                !enabled && "opacity-35",
              )}
              key={type}
              onClick={() => onToggleType(type)}
              type="button"
            >
              <span className={cn("size-2 rounded-full", config.dotColor)} />
              <span>{config.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

function ViewButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "h-7 flex-1 rounded-md px-3 font-medium text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-none",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function MonthView({
  date,
  events,
  onEventClick,
  onSelectDate,
  selectedDate,
}: {
  date: Date;
  events: ScholarshipCalendarEvent[];
  onEventClick: (event: ScholarshipCalendarEvent) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
}) {
  const days = useMemo(() => getCalendarDays(date), [date]);
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  return (
    <div className="flex h-full min-h-125 flex-col overflow-hidden sm:min-h-155">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            className="px-2 py-2 text-center font-medium text-muted-foreground text-xs"
            key={day}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = eventsByDay.get(dayKey(day)) || [];
          const isCurrentMonth = isSameMonth(day, date);
          const isSelected = selectedDate && isSameDay(selectedDate, day);

          return (
            <div
              className={cn(
                "group/day relative min-h-20 border-b p-1.5 sm:min-h-28",
                index % 7 !== 6 && "border-r",
                !isCurrentMonth && "bg-muted/20",
                isSelected && "bg-primary/8 ring-1 ring-primary/35 ring-inset",
              )}
              key={day.toISOString()}
            >
              <button
                aria-label={`Show events for ${format(day, "MMMM d, yyyy")}`}
                className={cn(
                  "mb-1 grid size-6 place-items-center rounded-full font-medium text-xs tabular-nums hover:bg-muted",
                  isToday(day) &&
                    "bg-primary text-primary-foreground hover:bg-primary/85",
                  !isCurrentMonth && "text-muted-foreground/55",
                )}
                onClick={() => onSelectDate(day)}
                type="button"
              >
                {format(day, "d")}
              </button>

              <button
                aria-label={`${dayEvents.length} events on ${format(day, "MMMM d")}`}
                className="flex w-full flex-wrap items-center gap-1 rounded p-0.5 text-left sm:hidden"
                onClick={() => onSelectDate(day)}
                type="button"
              >
                {uniqueEventTypes(dayEvents)
                  .slice(0, 3)
                  .map((type) => (
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        eventTypeConfig[type].dotColor,
                      )}
                      key={type}
                    />
                  ))}
                {dayEvents.length > 0 && (
                  <span className="font-medium text-[0.625rem] text-muted-foreground tabular-nums">
                    {dayEvents.length}
                  </span>
                )}
              </button>

              <div className="hidden space-y-0.5 sm:block">
                {dayEvents.slice(0, 3).map((event) => (
                  <MonthEvent
                    event={event}
                    key={event.id}
                    onEventClick={onEventClick}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <button
                    className="w-full rounded px-1.5 py-0.5 text-left font-medium text-[0.6875rem] text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => onSelectDate(day)}
                    type="button"
                  >
                    {dayEvents.length - 3} more
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

function MonthEvent({
  event,
  onEventClick,
}: {
  event: ScholarshipCalendarEvent;
  onEventClick: (event: ScholarshipCalendarEvent) => void;
}) {
  const config = eventTypeConfig[event.type];

  return (
    <HoverCard openDelay={220} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          aria-label={`${config.label}: ${event.scholarshipName}`}
          className={cn(
            "flex h-5 w-full items-center gap-1.5 rounded px-1.5 text-left text-[0.6875rem] transition-colors hover:brightness-95 dark:hover:brightness-110",
            config.tintColor,
            config.textColor,
          )}
          onClick={() => onEventClick(event)}
          type="button"
        >
          <span
            className={cn("size-1.5 shrink-0 rounded-full", config.dotColor)}
          />
          <span className="truncate font-medium">{event.scholarshipName}</span>
        </button>
      </HoverCardTrigger>
      <EventPreview event={event} />
    </HoverCard>
  );
}

function EventPreview({ event }: { event: ScholarshipCalendarEvent }) {
  const config = eventTypeConfig[event.type];

  return (
    <HoverCardContent align="start" className="w-80 p-0" side="top">
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-1.5 size-2.5 shrink-0 rounded-full",
              config.dotColor,
            )}
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-snug">
              {event.scholarshipName}
            </p>
            <p className={cn("mt-1 font-medium text-xs", config.textColor)}>
              {config.label}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Date</dt>
          <dd>{format(event.date, "EEEE, MMMM d, yyyy")}</dd>
          {event.roundName && (
            <>
              <dt className="text-muted-foreground">Round</dt>
              <dd className="truncate">{event.roundName}</dd>
            </>
          )}
        </dl>

        {event.description && (
          <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">
            {event.description}
          </p>
        )}

        {event.slug && (
          <Link
            className="inline-flex items-center gap-1 font-medium text-primary text-xs hover:underline"
            href={`/scholarships/${event.slug}`}
          >
            Open scholarship <ArrowUpRight className="size-3" />
          </Link>
        )}
      </div>
    </HoverCardContent>
  );
}

function YearView({
  date,
  events,
  onEventClick,
  onOpenMonth,
}: {
  date: Date;
  events: ScholarshipCalendarEvent[];
  onEventClick: (event: ScholarshipCalendarEvent) => void;
  onOpenMonth: (date: Date) => void;
}) {
  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);

  return (
    <div className="grid min-h-155 grid-cols-1 gap-x-8 gap-y-10 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, month) => {
        const monthDate = new Date(date.getFullYear(), month, 1);
        const days = getCalendarDays(monthDate);

        return (
          <section key={month}>
            <button
              className="mb-3 font-semibold text-sm hover:text-primary"
              onClick={() => onOpenMonth(monthDate)}
              type="button"
            >
              {format(monthDate, "MMMM")}
            </button>
            <div className="grid grid-cols-7 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <span
                  className="pb-2 text-[0.625rem] text-muted-foreground"
                  key={`${day}-${index}`}
                >
                  {day}
                </span>
              ))}

              {days.map((day) => {
                const dayEvents = eventsByDay.get(dayKey(day)) || [];
                const inMonth = getMonth(day) === month;
                const dayButton = (
                  <button
                    aria-label={`${format(day, "MMMM d")}${dayEvents.length ? `, ${dayEvents.length} events` : ""}`}
                    className={cn(
                      "relative mx-auto grid size-8 place-items-center rounded-full text-xs tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      !inMonth &&
                        "pointer-events-none text-muted-foreground/25",
                      isToday(day) &&
                        inMonth &&
                        "bg-primary text-primary-foreground hover:bg-primary/85",
                      dayEvents.length > 0 &&
                        inMonth &&
                        !isToday(day) &&
                        "font-semibold",
                    )}
                    disabled={!inMonth}
                    onClick={() => onOpenMonth(day)}
                    type="button"
                  >
                    {format(day, "d")}
                    {dayEvents.length > 0 && inMonth && (
                      <span className="absolute right-0 bottom-0 flex -space-x-0.5">
                        {uniqueEventTypes(dayEvents)
                          .slice(0, 3)
                          .map((type) => (
                            <span
                              className={cn(
                                "size-1.5 rounded-full ring-1 ring-card",
                                eventTypeConfig[type].dotColor,
                              )}
                              key={type}
                            />
                          ))}
                      </span>
                    )}
                  </button>
                );

                if (!dayEvents.length || !inMonth)
                  return <div key={day.toISOString()}>{dayButton}</div>;

                return (
                  <HoverCard
                    closeDelay={80}
                    key={day.toISOString()}
                    openDelay={180}
                  >
                    <HoverCardTrigger asChild>{dayButton}</HoverCardTrigger>
                    <HoverCardContent align="center" className="w-80 p-0">
                      <div className="border-b px-4 py-3">
                        <p className="font-semibold text-sm">
                          {format(day, "EEEE, MMMM d")}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {dayEvents.length}{" "}
                          {dayEvents.length === 1 ? "event" : "events"}
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {dayEvents.slice(0, 6).map((event) => (
                          <button
                            className="flex w-full items-start gap-2 rounded-md p-2 text-left hover:bg-muted"
                            key={event.id}
                            onClick={() => onEventClick(event)}
                            type="button"
                          >
                            <span
                              className={cn(
                                "mt-1.5 size-2 shrink-0 rounded-full",
                                eventTypeConfig[event.type].dotColor,
                              )}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-xs">
                                {event.scholarshipName}
                              </span>
                              <span className="text-[0.6875rem] text-muted-foreground">
                                {eventTypeConfig[event.type].shortLabel}
                              </span>
                            </span>
                          </button>
                        ))}
                        {dayEvents.length > 6 && (
                          <p className="px-2 py-1 text-muted-foreground text-xs">
                            {dayEvents.length - 6} more on this date
                          </p>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EventRail({
  date,
  events,
  onClearDate,
  onEventClick,
  selectedDate,
  today,
}: {
  date: Date;
  events: ScholarshipCalendarEvent[];
  onClearDate: () => void;
  onEventClick: (event: ScholarshipCalendarEvent) => void;
  selectedDate: Date | null;
  today: Date;
}) {
  const rail = useMemo(() => {
    if (selectedDate) {
      return {
        events: events.filter((event) => isSameDay(event.date, selectedDate)),
        label: format(selectedDate, "EEEE, MMMM d"),
      };
    }

    const monthEvents = events.filter((event) => isSameMonth(event.date, date));
    const upcomingInMonth = monthEvents.filter((event) => event.date >= today);
    if (monthEvents.length) {
      return {
        events: (upcomingInMonth.length ? upcomingInMonth : monthEvents).slice(
          0,
          40,
        ),
        label: "This month",
      };
    }

    const comingUp = events.filter((event) => event.date >= date).slice(0, 20);
    return {
      events: comingUp.length ? comingUp : events.slice(-20),
      label: comingUp.length ? "Coming up" : "Recent events",
    };
  }, [date, events, selectedDate, today]);

  return (
    <aside className="flex min-h-96 flex-col border-t bg-muted/10 xl:min-h-0 xl:border-t-0">
      <div className="flex items-start justify-between border-b px-4 py-3">
        <div>
          <h3 className="font-semibold text-sm">{rail.label}</h3>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {rail.events.length} {rail.events.length === 1 ? "event" : "events"}
          </p>
        </div>
        {selectedDate && (
          <Button
            aria-label="Clear selected date"
            onClick={onClearDate}
            size="icon-sm"
            variant="ghost"
          >
            <X />
          </Button>
        )}
      </div>

      <ScrollArea className="h-96 flex-1 xl:h-auto">
        {rail.events.length ? (
          <div className="divide-y">
            {rail.events.map((event) => (
              <EventRow
                event={event}
                key={event.id}
                onClick={() => onEventClick(event)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center px-6 text-center">
            <CalendarDays className="mb-3 size-5 text-muted-foreground" />
            <p className="font-medium text-sm">No events here</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Choose another date or adjust your filters.
            </p>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}

function AgendaView({
  events,
  hasFilters,
  onEventClick,
  onReset,
  today,
}: {
  events: ScholarshipCalendarEvent[];
  hasFilters: boolean;
  onEventClick: (event: ScholarshipCalendarEvent) => void;
  onReset: () => void;
  today: Date;
}) {
  const [visibleCount, setVisibleCount] = useState(100);
  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aIsPast = a.date < today;
        const bIsPast = b.date < today;
        if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
        return aIsPast
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime();
      }),
    [events, today],
  );

  const visibleEvents = sortedEvents.slice(0, visibleCount);
  const groupedEvents = useMemo(
    () => groupEventsByMonth(visibleEvents),
    [visibleEvents],
  );

  if (!events.length) {
    return (
      <div className="flex min-h-125 flex-col items-center justify-center px-6 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
          <ListFilter className="size-5" />
        </div>
        <h3 className="mt-4 font-semibold">No matching events</h3>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Try a broader search or include more event types and dates.
        </p>
        {hasFilters && (
          <Button className="mt-4" onClick={onReset} variant="outline">
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h3 className="font-semibold text-base">All matching events</h3>
          <p className="mt-1 text-muted-foreground text-xs">
            Upcoming first, followed by recent past events. Filters update
            instantly.
          </p>
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          Showing {Math.min(visibleCount, events.length)} of {events.length}
        </span>
      </div>

      <div className="space-y-8">
        {groupedEvents.map(([month, monthEvents]) => (
          <section className="grid gap-3 sm:grid-cols-[8rem_1fr]" key={month}>
            <div className="sm:sticky sm:top-3 sm:self-start">
              <h4 className="font-semibold text-sm">{month}</h4>
              {isSameMonth(monthEvents[0].date, today) && (
                <span className="text-primary text-xs">Current month</span>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border bg-background">
              {monthEvents.map((event, index) => (
                <div className={cn(index > 0 && "border-t")} key={event.id}>
                  <EventRow
                    event={event}
                    onClick={() => onEventClick(event)}
                    roomy
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {visibleCount < events.length && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={() => setVisibleCount((count) => count + 100)}
            variant="outline"
          >
            Show 100 more
          </Button>
        </div>
      )}
    </div>
  );
}

function EventRow({
  event,
  onClick,
  roomy = false,
}: {
  event: ScholarshipCalendarEvent;
  onClick: () => void;
  roomy?: boolean;
}) {
  const config = eventTypeConfig[event.type];

  return (
    <button
      className={cn(
        "group flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
        roomy && "sm:items-center sm:px-4 sm:py-3.5",
      )}
      onClick={onClick}
      type="button"
    >
      <time
        className={cn(
          "flex w-9 shrink-0 flex-col items-center rounded-md bg-muted px-1 py-1.5 text-center tabular-nums",
          roomy && "w-11 py-2",
        )}
        dateTime={format(event.date, "yyyy-MM-dd")}
      >
        <span className="font-semibold text-[0.625rem] text-muted-foreground uppercase">
          {format(event.date, "MMM")}
        </span>
        <span className={cn("font-semibold text-sm", roomy && "text-base")}>
          {format(event.date, "d")}
        </span>
      </time>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span
            className={cn("size-2 shrink-0 rounded-full", config.dotColor)}
          />
          <span className={cn("font-medium text-xs", config.textColor)}>
            {config.shortLabel}
          </span>
          {differenceInCalendarDays(event.date, new Date()) === 0 && (
            <Badge variant="secondary">Today</Badge>
          )}
        </span>
        <span className="mt-1 block truncate font-medium text-sm">
          {event.scholarshipName}
        </span>
        {(event.roundName || event.title !== config.label) && (
          <span className="mt-0.5 block truncate text-muted-foreground text-xs">
            {event.roundName || event.title}
          </span>
        )}
      </span>

      <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:self-center" />
    </button>
  );
}

function CalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="ml-auto h-8 w-56" />
        </div>
        <Skeleton className="h-9 w-full max-w-xl" />
      </div>
      <div className="grid min-h-155 grid-cols-7">
        {Array.from({ length: 35 }, (_, index) => (
          <div className="border-r border-b p-2" key={index}>
            <Skeleton className="size-6 rounded-full" />
            {index % 4 === 0 && <Skeleton className="mt-2 h-5 w-full" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function getCalendarDays(date: Date): Date[] {
  const firstVisibleDay = startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
  return Array.from({ length: 42 }, (_, index) =>
    addDays(firstVisibleDay, index),
  );
}

function dayKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function groupEventsByDay(events: ScholarshipCalendarEvent[]) {
  const grouped = new Map<string, ScholarshipCalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(event.date);
    const dayEvents = grouped.get(key) || [];
    dayEvents.push(event);
    grouped.set(key, dayEvents);
  }
  return grouped;
}

function groupEventsByMonth(events: ScholarshipCalendarEvent[]) {
  const grouped = new Map<string, ScholarshipCalendarEvent[]>();
  for (const event of events) {
    const key = format(event.date, "MMMM yyyy");
    const monthEvents = grouped.get(key) || [];
    monthEvents.push(event);
    grouped.set(key, monthEvents);
  }
  return Array.from(grouped.entries());
}

function uniqueEventTypes(events: ScholarshipCalendarEvent[]) {
  return Array.from(new Set(events.map((event) => event.type)));
}
