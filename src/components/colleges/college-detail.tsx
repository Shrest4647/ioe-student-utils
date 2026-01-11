"use client";

import {
  Building2,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
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
import { useCollegeDepartments } from "@/hooks/use-content";
import {
  useCollegeRatings,
  useRatingCategories,
} from "@/hooks/use-universities";

interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

interface College {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  location: string | null;
  isActive: boolean;
  university: {
    id: string;
    name: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    createdById: string | null;
    location: string | null;
    description: string | null;
    country: string | null;
    websiteUrl: string | null;
    establishedYear: string | null;
    logoUrl: string | null;
    isActive: boolean;
  } | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
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

interface CollegeDetailProps {
  college: College;
  user: User | null;
}

export function CollegeDetail({ college, user }: CollegeDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "ratings" | "departments"
  >("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: ratings,
    isLoading: ratingsLoading,
    refetch,
  } = useCollegeRatings(college.id);
  const { data: categories } = useRatingCategories("college");
  const { data: departments, isLoading: departmentsLoading } =
    useCollegeDepartments(college.id);

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this college");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "college",
          entityId: college.id,
          categoryId: data.categoryId,
          rating: data.rating,
          title: data.title,
          review: data.review,
        }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        refetch();
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (_error) {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    ratings && ratings.length > 0
      ? (
          ratings.reduce((sum, r) => sum + Number(r.rating), 0) / ratings.length
        ).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-muted">
          <GraduationCap className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
            {college.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            {college.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{college.location}</span>
              </div>
            )}
            <Badge variant={college.isActive ? "default" : "secondary"}>
              {college.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <RatingDisplay
              rating={Number(avgRating)}
              totalReviews={ratings?.length}
            />
          </div>
          {college.university && (
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
              <span>Part of</span>
              <Link
                href={`/universities/${college.university.id}`}
                className="text-primary hover:underline"
              >
                {college.university.name}
              </Link>
            </div>
          )}
          {college.websiteUrl && (
            <a
              href={college.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary text-sm transition-colors hover:text-primary/80"
            >
              <Globe className="h-4 w-4" />
              Visit Website
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="ml-auto">
          <RateButton
            entityName={college.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Rate This College
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
            {ratings && ratings.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {ratings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="departments">
            Departments
            {departments && departments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {departments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {college.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {college.description}
                </p>
              </CardContent>
            </Card>
          )}

          {college.university && (
            <Card>
              <CardHeader>
                <CardTitle>University</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <Link
                      href={`/universities/${college.university.id}`}
                      className="hover:underline"
                    >
                      <div className="font-medium">
                        {college.university.name}
                      </div>
                    </Link>
                    <div className="text-muted-foreground text-sm">
                      Explore more about this university
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {departments && departments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Departments</CardTitle>
                <CardDescription>
                  This college has {departments.length} departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {departments.map((department) => (
                    <div
                      key={department.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                    >
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <Link
                          href={`/departments/${department.slug}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{department.name}</div>
                        </Link>
                        {department.description && (
                          <div className="text-muted-foreground text-sm">
                            {department.description}
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
                {ratings?.length || 0} ratings from current and former students
              </p>
            </div>
            <RateButton
              entityName={college.name}
              categories={categories || []}
              isSubmitting={isSubmitting}
              onSubmit={handleRatingSubmit}
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              Rate This College
            </RateButton>
          </div>

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="py-6 text-center">
                <p className="mb-4 text-muted-foreground">
                  Sign in to rate this college and see detailed reviews
                </p>
                <Button>Sign In</Button>
              </CardContent>
            </Card>
          )}

          {ratingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : ratings && ratings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {ratings.map((rating) => (
                <RatingCard key={rating.id} rating={rating} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/20">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No ratings yet</p>
                <p className="text-muted-foreground text-sm">
                  Be the first to rate this college!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                Explore different departments within {college.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {departmentsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : departments && departments.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {departments.map((department: Department) => (
                    <Card key={department.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {department.name}
                        </CardTitle>
                        <Badge
                          variant={
                            department.isActive ? "default" : "secondary"
                          }
                        >
                          {department.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">
                          {department.description || "No description available"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No departments listed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
