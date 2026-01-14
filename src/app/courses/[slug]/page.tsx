"use client";

import { Clock, Loader2, Star } from "lucide-react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCourse } from "@/hooks/use-content";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data: course, isLoading, error } = useCourse(params.slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Course Not Found</CardTitle>
            <CardDescription>
              The course you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-3xl">{course.name}</CardTitle>
                  <Badge variant="outline" className="font-mono">
                    {course.code}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {course.description || "No description available"}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm">
                  {course.credits && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{course.credits} credits</span>
                    </div>
                  )}
                  <Badge variant={course.isActive ? "default" : "secondary"}>
                    {course.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <Button>
                <Star className="mr-2 h-4 w-4" />
                Rate This Course
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Part of Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.academicPrograms &&
                course.academicPrograms.length > 0 ? (
                  course.academicPrograms.map((program) => (
                    <div key={program.id}>
                      <div className="font-medium text-lg">
                        <a
                          href={`/programs/${program.code}`}
                          className="text-primary hover:underline"
                        >
                          {program.name}
                        </a>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {program.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This course is not currently part of any programs.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No ratings yet. Be the first to rate this course!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
