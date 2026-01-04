"use client";

import {
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const stats = [
    {
      id: "total-resources",
      title: "Total Resources",
      value: "128",
      description: "Notes, papers & books",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      id: "upcoming-exams",
      title: "Upcoming Exams",
      value: "3",
      description: "Next exam in 5 days",
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      id: "current-gpa",
      title: "Current GPA",
      value: "3.82",
      description: "Top 5% of class",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  const recentActivity = [
    {
      id: "applied-mechanics-note",
      title: "Applied Mechanics Note",
      time: "2 hours ago",
      type: "Download",
      icon: Clock,
    },
    {
      id: "be-entrance-model-test",
      title: "BE Entrance Model Test",
      time: "Yesterday",
      type: "Quiz",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="fade-in container mx-auto max-w-7xl animate-in space-y-8 p-4 duration-500 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span className="font-medium text-sm">Dashboard</span>
        </div>
        <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl tracking-tight md:text-4xl">
          Welcome back, {user?.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-lg text-muted-foreground italic">
          "The beautiful thing about learning is that no one can take it away
          from you."
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card
            key={stat.id}
            className="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/50"
          >
            <div
              className={cn(
                "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10",
                stat.bg,
              )}
            />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">
                {stat.title}
              </CardTitle>
              <div className={cn("rounded-lg p-2", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{stat.value}</div>
              <p className="mt-1 text-muted-foreground text-xs">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 md:grid-cols-7">
        {/* Recent Activity */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm md:col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interactions and downloads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="group flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-muted p-2 transition-colors group-hover:bg-primary/10">
                    <activity.icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-none">
                      {activity.title}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {activity.time} • {activity.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => router.push(`/activities/${activity.id}`)}
                  aria-label={`View ${activity.title} details`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="group mt-2 w-full border-dashed hover:border-solid"
            >
              View All Activity
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border/50 bg-background/50 backdrop-blur-sm md:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              className="h-12 w-full justify-start gap-3"
              variant="outline"
            >
              <div className="rounded-md bg-blue-500/10 p-1.5 text-blue-500">
                <BookOpen className="h-4 w-4" />
              </div>
              Browse Notes
            </Button>
            <Button
              className="h-12 w-full justify-start gap-3"
              variant="outline"
            >
              <div className="rounded-md bg-purple-500/10 p-1.5 text-purple-500">
                <Calendar className="h-4 w-4" />
              </div>
              Exam Schedule
            </Button>
            <Button
              className="h-12 w-full justify-start gap-3"
              variant="outline"
            >
              <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              GPA Calculator
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
