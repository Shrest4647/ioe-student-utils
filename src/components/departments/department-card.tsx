"use client";

import { Building2, Star } from "lucide-react";
import Link from "next/link";
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

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface DepartmentCardProps {
  department: Department;
  onSubmitRating?: (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => Promise<void> | void;
  categories?: RatingCategory[];
}

export function DepartmentCard({
  department,
  onSubmitRating,
  categories = [],
}: DepartmentCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-lg">
            <Link
              href={`/departments/${department.slug}`}
              className="decoration-primary underline-offset-4 hover:underline"
            >
              {department.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {department.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground/90">Academic Department</span>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <RateButton
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-primary hover:text-primary/80"
            categories={categories}
            entityName={department.name}
            onSubmit={onSubmitRating || (() => Promise.resolve())}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Rate This College
          </RateButton>
          {department.websiteUrl && (
            <a
              href={department.websiteUrl}
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
