"use client";

import { Building2, MapPin, Star } from "lucide-react";
import Image from "next/image";
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
import { useAuth } from "@/hooks/use-auth";
import { useRatingCategories } from "@/hooks/use-universities";
import { apiClient } from "@/lib/eden";

export interface University {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  country: string | null;
  websiteUrl: string | null;
  establishedYear: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface UniversityCardProps {
  university: University;
}

export function UniversityCard({ university }: UniversityCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: categories } = useRatingCategories("university");

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this university");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response, error } = await apiClient.api.ratings.post({
        entityType: "university",
        entityId: university.id,
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
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            {university.logoUrl ? (
              <Image
                height={200}
                width={200}
                src={university.logoUrl}
                alt={university.name}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="line-clamp-1 text-lg">
              <Link
                href={`/universities/${university.slug}`}
                className="decoration-primary underline-offset-4 hover:underline"
              >
                {university.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {university.description || "No description available"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground/90">
            {university.location || "Location not specified"}
          </span>
          {university.country && (
            <Badge variant="outline" className="ml-auto">
              {university.country}
            </Badge>
          )}
        </div>
        {university.establishedYear && (
          <div className="text-muted-foreground text-xs">
            Established: {university.establishedYear}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <RateButton
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-primary hover:text-primary/80"
            entityName={university.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This University</span>
          </RateButton>
          {university.websiteUrl && (
            <a
              href={university.websiteUrl}
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
