"use client";

import { Building2, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RateButton } from "@/components/ui/rate-button";
import { useAuth } from "@/hooks/use-auth";
import { useRatingCategories } from "@/hooks/use-universities";
import { apiClient } from "@/lib/eden";

export interface College {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  location: string | null;
  universityId: string;
  university: {
    id: string;
    name: string;
    slug: string;
  };
  isActive: boolean;
  createdAt: string | Date | null;
}

interface CollegeCardProps {
  college: College;
}

export function CollegeCard({ college }: CollegeCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: categories } = useRatingCategories("college");

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this college");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response, error } = await apiClient.api.ratings.post({
        entityType: "college",
        entityId: college.id,
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
              href={`/colleges/${college.slug}`}
              className="decoration-primary underline-offset-4 hover:underline"
            >
              {college.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {college.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Link
            href={`/universities/${college.university.slug}`}
            className="text-foreground/90 decoration-primary underline-offset-4 hover:underline"
          >
            {college.university.name}
          </Link>
        </div>
        {college.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground/90">{college.location}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <RateButton
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-primary hover:text-primary/80"
            entityName={college.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This College</span>
          </RateButton>
          {college.websiteUrl && (
            <a
              href={college.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground text-xs hover:text-primary"
            >
              Visit Website →
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
