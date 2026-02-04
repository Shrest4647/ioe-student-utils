"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Eye,
  FileText,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import { ActivityFeed } from "@/components/instructor/activity-feed";
import { QuickActions } from "@/components/instructor/quick-actions";
import { StatsCard } from "@/components/instructor/stats-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";

interface DashboardStats {
  totalCourses: number;
  totalUnits: number;
  totalTopics: number;
  totalViews: number;
}

interface Activity {
  id: string;
  type: "created" | "updated" | "deleted" | "viewed";
  entity: "course" | "unit" | "topic";
  entityName: string;
  userName: string;
  timestamp: string;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  // Use public endpoints as they provide the metadata with totalCount
  const { data: coursesData } = await apiClient.api[
    "course-explorer"
  ].courses.get({
    query: { limit: "1" },
  });

  const { data: unitsData } = await (
    apiClient.api["course-explorer"].units as any
  ).get({
    query: { limit: "1" },
  });

  // Fetch topics count
  const { data: topicsData } = await (
    apiClient.api["course-explorer"].topics as any
  ).get({
    query: { limit: "1" },
  });

  return {
    totalCourses: (coursesData as any)?.metadata?.totalCount || 0,
    totalUnits: (unitsData as any)?.metadata?.totalCount || 0,
    totalTopics: (topicsData as any)?.metadata?.totalCount || 0,
    totalViews: 0, // This would need a separate analytics endpoint
  };
}

async function fetchRecentActivity(): Promise<Activity[]> {
  // This would be a real endpoint in production
  // For now, returning mock data
  return [
    {
      id: "1",
      type: "created",
      entity: "course",
      entityName: "Data Structures and Algorithms",
      userName: "Admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "2",
      type: "updated",
      entity: "unit",
      entityName: "Module 1: Introduction",
      userName: "Admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "3",
      type: "created",
      entity: "topic",
      entityName: "Binary Search Trees",
      userName: "Admin",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ];
}

export default function InstructorDashboardPage() {
  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["instructor-stats"],
    queryFn: fetchDashboardStats,
  });

  const { data: activities, isLoading: isActivityLoading } = useQuery({
    queryKey: ["instructor-activity"],
    queryFn: fetchRecentActivity,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">
          Instructor Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your courses, units, and topics. Track engagement and create
          new content.
        </p>
      </div>

      {statsError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard statistics. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatsCard
              title="Total Courses"
              value={stats?.totalCourses || 0}
              description="Active courses on platform"
              icon={BookOpen}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              title="Total Units"
              value={stats?.totalUnits || 0}
              description="Modules and chapters"
              icon={GraduationCap}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              title="Total Topics"
              value={stats?.totalTopics || 0}
              description="Learning topics created"
              icon={FileText}
              trend={{ value: 24, isPositive: true }}
            />
            <StatsCard
              title="Total Views"
              value={stats?.totalViews || 0}
              description="Course content views"
              icon={Eye}
              trend={{ value: 15, isPositive: true }}
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        {isActivityLoading ? (
          <>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </>
        ) : (
          <>
            <ActivityFeed activities={activities || []} />
            <TrendingContent />
          </>
        )}
      </div>
    </div>
  );
}

function TrendingContent() {
  const { data: trendingCourses, isLoading } = useQuery({
    queryKey: ["trending-courses"],
    queryFn: async () => {
      const { data } = await apiClient.api["course-explorer"].courses.get({
        query: { limit: "5" },
      });
      return (data as any)?.data || [];
    },
  });

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b p-6">
        <TrendingUp className="h-4 w-4" />
        <h3 className="font-semibold">Trending Courses</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : trendingCourses?.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No courses available
          </p>
        ) : (
          <div className="space-y-3">
            {trendingCourses?.map(
              (course: { id: string; name: string; code?: string }) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{course.name}</p>
                    {course.code && (
                      <p className="text-muted-foreground text-xs">
                        {course.code}
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
