"use client";

import { BookOpen, GraduationCap, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RateButton } from "@/components/ui/rate-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingCard } from "@/components/universities/rating-card";
import { RatingDisplay } from "@/components/universities/rating-display";
import { useProgramCourses, useProgramRatings } from "@/hooks/use-content";
import { useRatingCategories } from "@/hooks/use-universities";
import { apiClient } from "@/lib/eden";

interface CollegeDepartment {
  id: string;
  college: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    websiteUrl: string | null;
    university: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
  department: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Program {
  id: string;
  name: string;
  code: string;
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
  createdAt: Date | null;
  updatedAt: Date | null;
  collegeDepartments: CollegeDepartment[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  isAnonymous?: boolean | null;
  twoFactorEnabled?: boolean | null;
  image?: string | null;
  createdAt: string | Date | null;
}

interface ProgramDetailProps {
  program: Program;
  user: User | null;
  entityType?: "program" | "collegeDepartmentProgram";
}

const degreeLevelColors: Record<string, string> = {
  certificate: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  diploma: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  associate: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  undergraduate: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  postgraduate: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  doctoral: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  postdoctoral: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

export function ProgramDetail({
  program,
  user,
  entityType = "program",
}: ProgramDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "ratings" | "courses"
  >("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: ratings,
    isLoading: ratingsLoading,
    refetch,
  } = useProgramRatings(program.id);
  const { data: categories } = useRatingCategories("program");
  const { data: courses, isLoading: coursesLoading } = useProgramCourses(
    program.id,
  );

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this program");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: response, error } = await apiClient.api.ratings.post({
        entityType,
        entityId: program.id,
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
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const mappedRatings = ratings
    ? ratings.map((item) => ({
        ...item,
        categoryId: item.ratingCategoryId,
        category: {
          id: item.ratingCategory?.id || "",
          name: item.ratingCategory?.name || "",
        },
        user: item.user
          ? {
              id: item.user.id,
              name: item.user.name,
              image: item.user.image,
            }
          : {
              id: "unknown",
              name: "Anonymous",
              image: null,
            },
      }))
    : [];

  const avgRating =
    mappedRatings.length > 0
      ? (
          mappedRatings.reduce((sum, r) => sum + Number(r.rating), 0) /
          mappedRatings.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-muted">
          <BookOpen className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
              {program.name}
            </h1>
            {program.degreeLevels && (
              <Badge
                variant="outline"
                className={degreeLevelColors[program.degreeLevels]}
              >
                {program.degreeLevels}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {program.code}
            </Badge>
            {program.credits && <span>{program.credits} credits</span>}
            <Badge variant={program.isActive ? "default" : "secondary"}>
              {program.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <RatingDisplay
              rating={Number(avgRating)}
              totalReviews={ratings?.length}
            />
          </div>
        </div>
        <div className="ml-auto">
          <RateButton
            entityName={program.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Rate This Program
          </RateButton>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v: string) => setActiveTab(v as typeof activeTab)}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ratings">
            Ratings
            {mappedRatings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {mappedRatings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses">
            Courses
            {courses && courses.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {courses.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {program.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {program.description}
                </p>
              </CardContent>
            </Card>
          )}

          {program.collegeDepartments &&
            program.collegeDepartments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Offered At</CardTitle>
                  <CardDescription>
                    This program is offered at{" "}
                    {program.collegeDepartments.length} colleges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {program.collegeDepartments.map((cd) => (
                      <div
                        key={cd.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                      >
                        <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        <div>
                          {cd.college && (
                            <Link
                              href={`/colleges/${cd.college.slug}`}
                              className="hover:underline"
                            >
                              <div className="font-medium">
                                {cd.college.name}
                              </div>
                            </Link>
                          )}
                          {cd.department && (
                            <div className="text-muted-foreground text-sm">
                              Department:{" "}
                              <Link
                                href={`/departments/${cd.department.slug}`}
                                className="text-primary hover:underline"
                              >
                                {cd.department.name}
                              </Link>
                            </div>
                          )}
                          {cd.college?.university && (
                            <div className="text-muted-foreground text-xs">
                              University:{" "}
                              <Link
                                href={`/universities/${cd.college.university.slug}`}
                                className="text-primary hover:underline"
                              >
                                {cd.college.university.name}
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="ratings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-2xl">Student Reviews</h2>
              <p className="text-muted-foreground">
                {mappedRatings.length} ratings from current and former students
              </p>
            </div>
            <RateButton
              entityName={program.name}
              categories={categories || []}
              isSubmitting={isSubmitting}
              onSubmit={handleRatingSubmit}
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              Rate This Program
            </RateButton>
          </div>

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="py-6 text-center">
                <p className="mb-4 text-muted-foreground">
                  Sign in to rate this program and see detailed reviews
                </p>
                <Button>Sign In</Button>
              </CardContent>
            </Card>
          )}

          {ratingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mappedRatings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mappedRatings.map((rating) => (
                <RatingCard key={rating.id} rating={rating} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/20">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No ratings yet</p>
                <p className="text-muted-foreground text-sm">
                  Be the first to rate this program!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>
                Explore courses in {program.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : courses && courses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Card key={course.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {course.code}
                          </Badge>
                          {course.credits && (
                            <span className="text-muted-foreground text-sm">
                              {course.credits} credits
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">
                          {course.description || "No description available"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No courses listed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
