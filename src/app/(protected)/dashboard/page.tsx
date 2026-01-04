"use client";

import {
  BookOpen,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Total Resources",
      value: "128",
      description: "Notes, papers & books",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Upcoming Exams",
      value: "3",
      description: "Next exam in 5 days",
      icon: Calendar,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
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
      title: "Applied Mechanics Note",
      time: "2 hours ago",
      type: "Download",
      icon: Clock,
    },
    {
      title: "BE Entrance Model Test",
      time: "Yesterday",
      type: "Quiz",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="h-4 w-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Welcome back, {user?.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-muted-foreground text-lg italic">
          "The beautiful thing about learning is that no one can take it away
          from you."
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, idx) => (
          <Card
            key={idx}
            className="group relative overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300"
          >
            <div
              className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                stat.bg
              )}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 md:grid-cols-7">
        {/* Recent Activity */}
        <Card className="md:col-span-4 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interactions and downloads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                    <activity.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time} • {activity.type}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2 group border-dashed hover:border-solid"
            >
              View All Activity
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="md:col-span-3 border-border/50 bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                <BookOpen className="h-4 w-4" />
              </div>
              Browse Notes
            </Button>
            <Button
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                <Calendar className="h-4 w-4" />
              </div>
              Exam Schedule
            </Button>
            <Button
              className="w-full justify-start gap-3 h-12"
              variant="outline"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
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
