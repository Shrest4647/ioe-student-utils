"use client";

import { addDays, format, formatDistanceToNowStrict } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LibraryBig,
  MapPin,
  NotebookPen,
  Settings2,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { useAuth } from "@/hooks/use-auth";
import { useMyResources } from "@/hooks/use-my-resources";
import { useResources } from "@/hooks/use-resources";
import {
  useScholarshipEvents,
  useScholarships,
} from "@/hooks/use-scholarships";
import { cn } from "@/lib/utils";

const DEADLINE_RANGE_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
];

const EVENT_LABELS: Record<string, string> = {
  deadline: "Deadline",
  open: "Applications open",
  interview: "Interview",
  webinar: "Webinar",
  result_announcement: "Results",
};

const STUDENT_ACTIONS: DashboardAction[] = [
  {
    title: "Find study resources",
    description: "Browse notes, books, and past papers.",
    href: "/resources",
    icon: LibraryBig,
  },
  {
    title: "Build a study plan",
    description: "Turn a syllabus into manageable tasks.",
    href: "/study-planner",
    icon: NotebookPen,
  },
  {
    title: "Practise with quizzes",
    description: "Check your understanding by topic.",
    href: "/quiz",
    icon: CheckCircle2,
  },
  {
    title: "Review flashcards",
    description: "Recall key ideas in short sessions.",
    href: "/flashcards",
    icon: Sparkles,
  },
];

interface DashboardAction {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export default function DashboardPage() {
  const { user, isEmailVerified } = useAuth();
  const [deadlineRange, setDeadlineRange] = useState(14);
  const today = useMemo(() => new Date(), []);
  const endDate = useMemo(
    () => addDays(today, deadlineRange),
    [today, deadlineRange],
  );

  const resourcesQuery = useResources({ search: "", limit: "1" });
  const scholarshipsQuery = useScholarships({
    search: "",
    country: "",
    degree: "",
    field: "",
    page: 1,
  });
  const eventsQuery = useScholarshipEvents(today, endDate);
  const myResourcesQuery = useMyResources();
  const isAdmin = user?.role === "admin";
  const adminStatsQuery = useAdminStats(isAdmin);

  const totalResources =
    resourcesQuery.data?.pages[0]?.metadata.totalCount ?? 0;
  const totalScholarships =
    scholarshipsQuery.data?.pages[0]?.metadata.totalCount ?? 0;
  const myResourcesCount = myResourcesQuery.data?.data.length ?? 0;
  const upcomingDeadlinesCount = eventsQuery.data?.length ?? 0;
  const adminStats = adminStatsQuery.data;
  const hasDataError =
    resourcesQuery.isError ||
    scholarshipsQuery.isError ||
    eventsQuery.isError ||
    myResourcesQuery.isError ||
    (isAdmin && adminStatsQuery.isError);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Student";

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <header className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-medium text-muted-foreground text-sm">
              {format(today, "EEEE, d MMMM")}
            </p>
            <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground leading-7">
              Keep an eye on upcoming opportunities, then pick up the study tool
              you need.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg" variant="outline">
              <Link href="/resources">
                <BookOpen data-icon="inline-start" />
                Browse resources
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/study-planner">
                Plan my study
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </header>

        <div className="space-y-3 py-6">
          {!isEmailVerified && (
            <Alert className="border-primary/25 bg-primary/5 py-3">
              <AlertCircle className="text-primary" />
              <AlertTitle>Verify your email to unlock every feature</AlertTitle>
              <AlertDescription>
                Confirm your address so your account can use all student tools.
              </AlertDescription>
              <AlertAction>
                <Button asChild size="sm" variant="outline">
                  <Link href="/verify-email">Verify email</Link>
                </Button>
              </AlertAction>
            </Alert>
          )}

          {hasDataError && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle />
              <AlertTitle>Some dashboard data could not be loaded</AlertTitle>
              <AlertDescription>
                The available sections are still usable. Refresh to try loading
                the remaining statistics again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <section aria-labelledby="snapshot-heading" className="pb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-medium text-primary text-xs uppercase tracking-[0.16em]">
                Live from the catalogue
              </p>
              <h2 id="snapshot-heading" className="mt-1 font-semibold text-lg">
                Your academic snapshot
              </h2>
            </div>
            <p className="hidden text-muted-foreground text-xs sm:block">
              Updated as catalogue data changes
            </p>
          </div>

          <div className="grid overflow-hidden rounded-xl border bg-background shadow-xs sm:grid-cols-2 lg:grid-cols-4">
            <SnapshotMetric
              label="Library resources"
              value={totalResources}
              detail="Available to browse"
              icon={BookOpen}
              isLoading={resourcesQuery.isLoading}
            />
            <SnapshotMetric
              label="Scholarships listed"
              value={totalScholarships}
              detail="Across all providers"
              icon={GraduationCap}
              isLoading={scholarshipsQuery.isLoading}
            />
            <SnapshotMetric
              label="Dates ahead"
              value={upcomingDeadlinesCount}
              detail={`Within ${deadlineRange} days`}
              icon={CalendarDays}
              isLoading={eventsQuery.isLoading}
            />
            <SnapshotMetric
              label="Your contributions"
              value={myResourcesCount}
              detail="Resources uploaded"
              icon={Upload}
              isLoading={myResourcesQuery.isLoading}
              isLast
            />
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)] lg:gap-14">
          <section aria-labelledby="deadlines-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="deadlines-heading" className="font-semibold text-xl">
                  Scholarship timeline
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  Application dates and events that need your attention.
                </p>
              </div>
              <Select
                value={String(deadlineRange)}
                onValueChange={(value) => setDeadlineRange(Number(value))}
              >
                <SelectTrigger
                  className="w-32 bg-background"
                  aria-label="Scholarship timeline range"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEADLINE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
              {eventsQuery.isLoading ? (
                <DeadlineSkeleton />
              ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
                <div className="divide-y">
                  {eventsQuery.data.slice(0, 5).map((event) => (
                    <DeadlineRow key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-4 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                    <CalendarDays className="size-5" />
                  </div>
                  <h3 className="font-medium">No dates in this window</h3>
                  <p className="mt-1 max-w-sm text-muted-foreground text-sm leading-6">
                    Try a longer range, or browse all scholarships while you
                    have time to prepare.
                  </p>
                  <Button asChild className="mt-5" variant="outline">
                    <Link href="/scholarships">Browse scholarships</Link>
                  </Button>
                </div>
              )}
              <div className="border-t bg-muted/30 px-4 py-3 sm:px-5">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-between"
                >
                  <Link href="/scholarships/calendar">
                    Open the full scholarship calendar
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading" className="font-semibold text-xl">
              Continue your work
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Direct paths to the most useful student tools.
            </p>

            <div className="mt-4 divide-y border-y">
              {STUDENT_ACTIONS.map((action) => (
                <ActionRow key={action.href} action={action} />
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-primary/8 p-5 ring-1 ring-primary/15">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Upload className="size-4" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Share what helped you</h3>
                  <p className="mt-1 text-muted-foreground text-sm leading-6">
                    Add a useful resource to the student library and manage your
                    existing contributions.
                  </p>
                  <Button asChild variant="link" className="mt-2 h-auto p-0">
                    <Link href="/dashboard/resources">
                      Manage my resources
                      <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {isAdmin && (
          <AdminOverview
            stats={adminStats}
            isLoading={adminStatsQuery.isLoading}
          />
        )}
      </div>
    </main>
  );
}

interface SnapshotMetricProps {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  isLoading: boolean;
  isLast?: boolean;
}

function SnapshotMetric({
  label,
  value,
  detail,
  icon: Icon,
  isLoading,
  isLast = false,
}: SnapshotMetricProps) {
  return (
    <div
      className={cn(
        "relative min-h-32 border-b p-5 lg:border-r lg:border-b-0 sm:[&:nth-child(odd)]:border-r",
        isLast && "border-b-0 lg:border-r-0",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-muted-foreground text-sm">{label}</p>
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      {isLoading ? (
        <Skeleton className="mt-4 h-8 w-16" />
      ) : (
        <p className="mt-3 font-semibold text-3xl tabular-nums tracking-tight">
          {value.toLocaleString()}
        </p>
      )}
      <p className="mt-1 text-muted-foreground text-xs">{detail}</p>
    </div>
  );
}

function DeadlineSkeleton() {
  return (
    <output
      className="block divide-y"
      aria-label="Loading scholarship timeline"
    >
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-4 px-4 py-5 sm:px-5">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </output>
  );
}

interface DeadlineRowProps {
  event: NonNullable<ReturnType<typeof useScholarshipEvents>["data"]>[number];
}

function DeadlineRow({ event }: DeadlineRowProps) {
  const eventDate = new Date(event.date);
  const scholarship = event.round?.scholarship;
  const href = scholarship?.slug
    ? `/scholarships/${scholarship.slug}`
    : "/scholarships/calendar";
  const eventLabel = EVENT_LABELS[event.type] ?? "Event";

  return (
    <Link
      href={href}
      className="group grid gap-3 px-4 py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-5"
    >
      <div
        className={cn(
          "hidden size-10 place-items-center rounded-lg sm:grid",
          event.type === "deadline"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary",
        )}
      >
        {event.type === "deadline" ? (
          <Clock3 className="size-4" />
        ) : (
          <CalendarDays className="size-4" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-sm">
            {scholarship?.name ?? event.name}
          </p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium text-[0.6875rem]",
              event.type === "deadline"
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            {eventLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-muted-foreground text-xs">
          {event.name}
          {event.round?.roundName ? ` · ${event.round.roundName}` : ""}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end sm:text-right">
        <div>
          <p className="font-medium text-sm tabular-nums">
            {format(eventDate, "d MMM")}
          </p>
          <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
            {formatDistanceToNowStrict(eventDate, { addSuffix: true })}
          </p>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

function ActionRow({ action }: { action: DashboardAction }) {
  const Icon = action.icon;

  return (
    <Link
      href={action.href}
      className="group flex items-center gap-3 py-4 outline-none transition-colors hover:text-primary focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm">{action.title}</p>
        <p className="mt-0.5 text-muted-foreground text-xs">
          {action.description}
        </p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

interface AdminOverviewProps {
  stats:
    | {
        universities: number;
        colleges: number;
        programs: number;
        courses: number;
      }
    | undefined;
  isLoading: boolean;
}

function AdminOverview({ stats, isLoading }: AdminOverviewProps) {
  const items = [
    {
      label: "Universities",
      value: stats?.universities ?? 0,
      icon: Building2,
      href: "/dashboard/universities",
    },
    {
      label: "Colleges",
      value: stats?.colleges ?? 0,
      icon: MapPin,
      href: "/dashboard/colleges",
    },
    {
      label: "Programs",
      value: stats?.programs ?? 0,
      icon: GraduationCap,
      href: "/dashboard/programs",
    },
    {
      label: "Courses",
      value: stats?.courses ?? 0,
      icon: FileText,
      href: "/dashboard/courses",
    },
  ];

  return (
    <section aria-labelledby="admin-heading" className="mt-12 border-t pt-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.55fr)_minmax(0,1.45fr)] lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Settings2 className="size-4" />
            <p className="font-medium text-xs uppercase tracking-[0.16em]">
              Admin workspace
            </p>
          </div>
          <h2 id="admin-heading" className="mt-2 font-semibold text-xl">
            Catalogue inventory
          </h2>
          <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-6">
            Current database totals for the academic structure you manage.
          </p>
        </div>

        <div className="grid overflow-hidden rounded-xl border bg-background shadow-xs sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.label}
                className={cn(
                  "group border-b p-4 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:border-r lg:border-b-0 sm:[&:nth-child(odd)]:border-r",
                  index === items.length - 1 && "border-b-0 lg:border-r-0",
                )}
              >
                <div className="flex items-center justify-between gap-2 text-muted-foreground">
                  <span className="font-medium text-xs">{item.label}</span>
                  <Icon className="size-3.5 transition-colors group-hover:text-primary" />
                </div>
                {isLoading ? (
                  <Skeleton className="mt-3 h-7 w-12" />
                ) : (
                  <p className="mt-2 font-semibold text-2xl tabular-nums">
                    {item.value.toLocaleString()}
                  </p>
                )}
                <span className="mt-1 flex items-center gap-1 text-[0.6875rem] text-muted-foreground group-hover:text-foreground">
                  Manage
                  <ArrowRight className="size-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
