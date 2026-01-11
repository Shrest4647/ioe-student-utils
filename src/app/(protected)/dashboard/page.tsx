"use client";

import { addDays } from "date-fns";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Settings2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function DashboardPage() {
  const { user, isEmailVerified } = useAuth();
  const router = useRouter();
  const [deadlineRange, setDeadlineRange] = useState(14);

  const startDate = useMemo(() => new Date(), []);
  const endDate = addDays(startDate, deadlineRange);

  const resourcesQuery = useResources({ search: "", limit: "1" });
  const scholarshipsQuery = useScholarships({
    search: "",
    country: "",
    degree: "",
    field: "",
    page: 1,
  });
  const eventsQuery = useScholarshipEvents(startDate, endDate);
  const myResourcesQuery = useMyResources();
  const adminStatsQuery = useAdminStats();

  const isAdmin = user?.role === "admin";
  const totalResources =
    resourcesQuery.data?.pages[0]?.metadata.totalCount ?? 0;
  const totalScholarships =
    scholarshipsQuery.data?.pages[0]?.metadata.totalCount ?? 0;
  const myResourcesCount = myResourcesQuery.data?.data.length ?? 0;
  const upcomingDeadlinesCount = eventsQuery.data?.length ?? 0;
  const adminStats = adminStatsQuery.data;

  const quickActions = [
    {
      id: "browse-resources",
      title: "Browse Resources",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/resources",
    },
    {
      id: "browse-scholarships",
      title: "Browse Scholarships",
      icon: GraduationCap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/scholarships",
    },
    {
      id: "scholarship-calendar",
      title: "Scholarship Calendar",
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      href: "/scholarships/calendar",
    },
    {
      id: "upload-resource",
      title: "Upload Resource",
      icon: Upload,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/dashboard/resources",
    },
    {
      id: "browse-universities",
      title: "Browse Universities",
      icon: MapPin,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/universities",
    },
    ...(isAdmin
      ? [
          {
            id: "manage-universities",
            title: "Manage Universities",
            icon: Building2,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
            href: "/dashboard/universities",
          },
          {
            id: "manage-scholarships",
            title: "Manage Scholarships",
            icon: GraduationCap,
            color: "text-pink-500",
            bg: "bg-pink-500/10",
            href: "/dashboard/scholarships",
          },
          {
            id: "manage-resources",
            title: "Manage Resources",
            icon: FileText,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            href: "/dashboard/resources",
          },
        ]
      : []),
  ];

  return (
    <div className="fade-in container mx-auto max-w-7xl animate-in space-y-6 p-4 duration-500 md:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span className="font-medium text-sm">Dashboard</span>
        </div>
        <h1 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl tracking-tight md:text-4xl">
          Welcome back, {user?.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-lg text-muted-foreground italic">
          "The beautiful thing about learning is that no one can take it away
          from you."
        </p>
      </div>

      {!isEmailVerified && (
        <Alert variant="default" className="border-amber-200 bg-amber-50/50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">
            Email Verification Required
          </AlertTitle>
          <AlertDescription>
            Please verify your email address to access all features.
            <Button
              variant="link"
              className="h-auto p-0 text-amber-700 underline-offset-4 hover:text-amber-900"
              onClick={() => router.push("/auth/verify-email")}
            >
              Verify Email
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resources"
          value={totalResources}
          description="Notes, papers & books"
          icon={BookOpen}
          color="text-blue-500"
          bg="bg-blue-500/10"
          isLoading={resourcesQuery.isLoading}
        />
        <StatCard
          title="Total Scholarships"
          value={totalScholarships}
          description="Available opportunities"
          icon={GraduationCap}
          color="text-purple-500"
          bg="bg-purple-500/10"
          isLoading={scholarshipsQuery.isLoading}
        />
        <Card className="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="font-medium text-sm">
                Upcoming Deadlines
              </CardTitle>
              <Select
                value={String(deadlineRange)}
                onValueChange={(value) => setDeadlineRange(Number(value))}
              >
                <SelectTrigger className="h-6 w-auto border-none bg-transparent p-0 font-medium text-muted-foreground text-xs hover:bg-transparent focus:ring-0 focus:ring-offset-0">
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
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{upcomingDeadlinesCount}</div>
            )}
            <p className="mt-1 text-muted-foreground text-xs">
              Next {deadlineRange} days
            </p>
          </CardContent>
        </Card>
        <StatCard
          title="My Uploaded Resources"
          value={myResourcesCount}
          description="Your contributions"
          icon={Upload}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
          isLoading={myResourcesQuery.isLoading}
        />
      </div>

      {isAdmin && adminStatsQuery.data && (
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-500" />
              <CardTitle>Admin Overview</CardTitle>
            </div>
            <CardDescription>
              Platform content management statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Universities"
                value={adminStats?.universities ?? 0}
                description="Institutions"
                icon={Building2}
                color="text-indigo-500"
                bg="bg-indigo-500/10"
                isLoading={adminStatsQuery.isLoading}
                compact
              />
              <StatCard
                title="Colleges"
                value={adminStats?.colleges ?? 0}
                description="Campuses"
                icon={Building2}
                color="text-cyan-500"
                bg="bg-cyan-500/10"
                isLoading={adminStatsQuery.isLoading}
                compact
              />
              <StatCard
                title="Programs"
                value={adminStats?.programs ?? 0}
                description="Degree programs"
                icon={GraduationCap}
                color="text-teal-500"
                bg="bg-teal-500/10"
                isLoading={adminStatsQuery.isLoading}
                compact
              />
              <StatCard
                title="Courses"
                value={adminStats?.courses ?? 0}
                description="Academic courses"
                icon={BookOpen}
                color="text-rose-500"
                bg="bg-rose-500/10"
                isLoading={adminStatsQuery.isLoading}
                compact
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Upcoming Scholarship Deadlines</CardTitle>
            <CardDescription>
              Events and deadlines in the next {deadlineRange} days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventsQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : eventsQuery.data?.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-2 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">
                  No upcoming deadlines in the selected period
                </p>
              </div>
            ) : (
              eventsQuery.data?.map((event: any) => {
                const eventDate = new Date(event.date);
                const isDeadline = event.type === "deadline";
                const isResult = event.type === "result_announcement";

                return (
                  <div
                    key={event.id}
                    className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          isDeadline
                            ? "bg-red-500/10"
                            : isResult
                              ? "bg-green-500/10"
                              : "bg-blue-500/10",
                        )}
                      >
                        <Calendar
                          className={cn(
                            "h-4 w-4",
                            isDeadline
                              ? "text-red-500"
                              : isResult
                                ? "text-green-500"
                                : "text-blue-500",
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm leading-none">
                          {event.name}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {event.round?.scholarship?.name} •{" "}
                          {event.type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-xs">
                        {eventDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {eventDate.toLocaleDateString("en-US", {
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <Button
              variant="outline"
              className="group mt-2 w-full border-dashed hover:border-solid"
              onClick={() => router.push("/scholarships/calendar")}
            >
              View Full Calendar
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                className="h-12 w-full justify-start gap-3"
                variant="outline"
                onClick={() => router.push(action.href)}
              >
                <div
                  className={cn("rounded-md p-1.5", action.bg, action.color)}
                >
                  <action.icon className="h-4 w-4" />
                </div>
                {action.title}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: any;
  color: string;
  bg: string;
  isLoading?: boolean;
  compact?: boolean;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  bg,
  isLoading = false,
  compact = false,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50",
        compact && "border-none bg-transparent shadow-none",
      )}
    >
      {!compact && (
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10",
            bg,
          )}
        />
      )}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", compact ? "p-1.5" : "", bg)}>
          <Icon
            className={cn("h-4 w-4", color, compact ? "h-3.5 w-3.5" : "")}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className={cn("h-8 w-16", compact && "h-7 w-12")} />
        ) : (
          <div className={cn("font-bold text-2xl", compact && "text-xl")}>
            {value.toLocaleString()}
          </div>
        )}
        <p className="mt-1 text-muted-foreground text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}
