"use client";

import { BookOpen, GraduationCap, Star } from "lucide-react";
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

export interface Program {
  id: string;
  name: string;
  code: string;
  slug: string | null;
  description: string | null;
  credits: string | null;
  degreeLevels:
    | "certificate"
    | "diploma"
    | "associate"
    | "undergraduate"
    | "postgraduate"
    | "doctoral"
    | "postdoctoral"
    | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface ProgramCardProps {
  program: Program;
  onSubmitRating?: (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => Promise<void> | void;
  categories?: RatingCategory[];
}

export function ProgramCard({
  program,
  onSubmitRating,
  categories = [],
}: ProgramCardProps) {
  const degreeLevelColors: Record<string, string> = {
    certificate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    diploma: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    associate: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    undergraduate: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    postgraduate: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    doctoral: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    postdoctoral: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  };

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="line-clamp-1 text-lg">
              <Link
                href={`/programs/${program.code}`}
                className="decoration-primary underline-offset-4 hover:underline"
              >
                {program.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {program.description || "No description available"}
            </CardDescription>
          </div>
          {program.degreeLevels && (
            <Badge
              variant="outline"
              className={degreeLevelColors[program.degreeLevels]}
            >
              {program.degreeLevels}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground text-xs">Code:</span>
          <span className="font-mono text-foreground/90">{program.code}</span>
        </div>
        {program.credits && (
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Credits:</span>
            <span className="text-foreground/90">{program.credits}</span>
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
            entityName={program.name}
            onSubmit={onSubmitRating || (() => Promise.resolve())}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This Program</span>
          </RateButton>
        </div>
      </CardFooter>
    </Card>
  );
}
