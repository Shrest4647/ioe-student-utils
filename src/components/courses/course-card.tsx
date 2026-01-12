"use client";

import { Clock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
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
import { useAuth } from "@/hooks/use-auth";
import { useRatingCategories } from "@/hooks/use-universities";
import { apiClient } from "@/lib/eden";

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
    review: string;
  }) => Promise<void>;
  categories?: RatingCategory[];
}

export function CourseCard({
  course,
  onSubmitRating,
  categories: initialCategories,
}: CourseCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: fetchedCategories } = useRatingCategories("course");
  const categories = initialCategories || fetchedCategories || [];

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    review: string;
  }) => {
    if (onSubmitRating) {
      return onSubmitRating(data);
    }

    if (!user) {
      toast.error("Please sign in to rate this course");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response, error } = await apiClient.api.ratings.post({
        entityType: "course",
        entityId: course.id,
        categoryId: data.categoryId,
        rating: data.rating,
        review: data.review,
      });

      if (error || !response?.success) {
        throw new Error(
          (typeof error?.value === "object"
            ? (error.value as any)?.message || (error.value as any)?.error
            : error?.value) || "Failed to submit review",
        );
      }

      toast.success("Review submitted successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="h-7 gap-1.5 px-2 text-primary hover:text-primary/80"
            categories={categories}
            entityName={course.name}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This Course</span>
          </RateButton>
        </div>
      </CardFooter>
    </Card>
  );
}
