"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RateButton } from "@/components/ui/rate-button";
import type { RatingCategory } from "@/components/universities/rating-dialog";

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  credits: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface CourseCardProps {
  course: Course;
  onSubmitRating?: (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => Promise<void> | void;
  categories?: RatingCategory[];
}

export function CourseCard({
  course,
  onSubmitRating,
  categories = [],
}: CourseCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-lg">
            <Link
              href={`/courses/${course.code}`}
              className="decoration-primary underline-offset-4 hover:underline"
            >
              {course.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {course.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono">
            {course.code}
          </Badge>
        </div>
        {course.credits && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Credits:</span>
            <span className="text-foreground/90">{course.credits}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center text-sm">
          <RateButton
            variant="ghost"
            size="sm"
            categories={categories}
            entityName={course.name}
            onSubmit={onSubmitRating || (() => Promise.resolve())}
          >
            <span className="font-medium">Rate This Course</span>
          </RateButton>
        </div>
      </CardFooter>
    </Card>
  );
}
