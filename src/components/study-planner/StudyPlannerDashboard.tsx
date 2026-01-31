"use client";

import { BookOpen, ListTodo, Plus, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { DailyTaskView } from "./DailyTaskView";
import { StudyPlanCreator } from "./StudyPlanCreator";

interface StudyPlan {
  id: string;
  subjectName: string;
  examDate: string;
  progressPercentage: string;
  status: string;
}

export function StudyPlannerDashboard() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/study-plans?userId=${user.id}`);

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching study plans:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user, fetchPlans]);

  // Calculate stats
  const activePlansCount = plans.filter((p) => p.status === "active").length;

  const todaysTasksCount = plans.reduce((sum, plan) => {
    const progress = parseFloat(plan.progressPercentage || 0);
    return sum + Math.floor(progress / 10);
  }, 0);

  const overallProgress =
    plans.length > 0
      ? Math.round(
          plans.reduce(
            (sum, plan) => sum + parseFloat(plan.progressPercentage || 0),
            0,
          ) / plans.length,
        )
      : 0;

  // Show creator
  if (showCreator) {
    return (
      <div>
        <Button
          variant="ghost"
          onClick={() => setShowCreator(false)}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <StudyPlanCreator
          onSuccess={() => {
            setShowCreator(false);
            fetchPlans();
          }}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading your study plans...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Study Planner</h1>
          <p className="text-muted-foreground">
            Track your exam preparation progress
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="mr-2 size-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Plans</CardTitle>
            <BookOpen className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activePlansCount}</div>
            <p className="text-muted-foreground text-xs">
              {activePlansCount === 1 ? "plan" : "plans"} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Today&apos;s Tasks
            </CardTitle>
            <ListTodo className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{todaysTasksCount}</div>
            <p className="text-muted-foreground text-xs">tasks scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Overall Progress
            </CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{overallProgress}%</div>
            <p className="text-muted-foreground text-xs">average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Study Plans Section */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">Active Study Plans</h2>
        {plans.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto size-12 text-muted-foreground opacity-50" />
              <h3 className="mt-4 font-semibold text-lg">No study plans yet</h3>
              <p className="mb-6 text-muted-foreground">
                Create your first study plan to start tracking your exam
                preparation
              </p>
              <Button onClick={() => setShowCreator(true)}>
                <Plus className="mr-2 size-4" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans
              .filter((p) => p.status === "active")
              .map((plan) => {
                const progress = parseFloat(plan.progressPercentage || 0);
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <CardTitle>{plan.subjectName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary">
                          <div
                            className="h-2 rounded-full bg-primary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground text-sm">
                          <span>
                            Exam: {new Date(plan.examDate).toLocaleDateString()}
                          </span>
                          <Badge
                            variant={progress >= 80 ? "default" : "secondary"}
                          >
                            {progress >= 80 ? "On Track" : "In Progress"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Today&apos;s Tasks Section */}
      <div>
        <h2 className="mb-4 font-semibold text-xl">Today&apos;s Tasks</h2>
        <DailyTaskView />
      </div>
    </div>
  );
}
