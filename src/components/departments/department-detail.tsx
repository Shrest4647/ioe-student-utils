"use client";

import {
  Building2,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
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
import { useDepartmentColleges } from "@/hooks/use-content";
import {
  useDepartmentRatings,
  useRatingCategories,
} from "@/hooks/use-universities";

interface College {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  university: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
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

interface DepartmentDetailProps {
  department: Department;
  user: User | null;
}

export function DepartmentDetail({ department, user }: DepartmentDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "ratings" | "colleges"
  >("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: ratings,
    isLoading: ratingsLoading,
    refetch,
  } = useDepartmentRatings(department.id);
  const { data: categories } = useRatingCategories("department");
  const { data: colleges, isLoading: collegesLoading } = useDepartmentColleges(
    department.id,
  );

  const handleRatingSubmit = async (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this department");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "department",
          entityId: department.id,
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
            {department.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
            <Badge variant={department.isActive ? "default" : "secondary"}>
              {department.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <RatingDisplay
              rating={Number(avgRating)}
              totalReviews={ratings?.length}
            />
          </div>
          {department.websiteUrl && (
            <a
              href={department.websiteUrl}
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
            entityName={department.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Rate This Department
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
          <TabsTrigger value="colleges">
            Colleges
            {colleges && colleges.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {colleges.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {department.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {department.description}
                </p>
              </CardContent>
            </Card>
          )}

          {colleges && colleges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Offered At</CardTitle>
                <CardDescription>
                  This department is offered at {colleges.length} colleges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {colleges.map((college) => (
                    <div
                      key={college.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                    >
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <Link
                          href={`/colleges/${college.slug}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{college.name}</div>
                        </Link>
                        <div className="text-muted-foreground text-sm">
                          {college.university?.name || "University"}
                        </div>
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
              entityName={department.name}
              categories={categories || []}
              isSubmitting={isSubmitting}
              onSubmit={handleRatingSubmit}
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              Rate This Department
            </RateButton>
          </div>

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="py-6 text-center">
                <p className="mb-4 text-muted-foreground">
                  Sign in to rate this department and see detailed reviews
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
                  Be the first to rate this department!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="colleges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Offered At</CardTitle>
              <CardDescription>
                Explore colleges offering {department.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collegesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : colleges && colleges.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {colleges.map((college: College) => (
                    <Card key={college.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {college.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          {college.university?.name || "University"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">
                          {college.description || "No description available"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No colleges listed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
