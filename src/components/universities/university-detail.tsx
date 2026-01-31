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
import Image from "next/image";
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
import {
  useRatingCategories,
  useUniversityRatings,
} from "@/hooks/use-universities";
import { apiClient } from "@/lib/eden";
import { RatingCard } from "./rating-card";
import { RatingDisplay } from "./rating-display";
import type { University } from "./university-card";

interface College {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  description: string | null;
  websiteUrl: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
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

interface UniversityDetailProps {
  university: University & { colleges: College[] };
  user: User | null;
}

export function UniversityDetail({ university, user }: UniversityDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "ratings" | "colleges"
  >("overview");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    data: ratings,
    isLoading: ratingsLoading,
    refetch,
  } = useUniversityRatings(university.id);
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
      const response = await apiClient.api.ratings.post({
        entityType: "university",
        entityId: university.id,
        categoryId: data.categoryId,
        rating: data.rating,
        review: data.review,
      });

      if (response?.data?.success) {
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
      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted">
          {university.logoUrl ? (
            <Image
              height={200}
              width={200}
              src={university.logoUrl}
              alt={university.name}
              className="h-20 w-20 object-contain"
            />
          ) : (
            <Building2 className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-3xl text-transparent tracking-tight lg:text-4xl">
            {university.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm">
            {university.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{university.location}</span>
              </div>
            )}
            {university.country && (
              <Badge variant="outline">{university.country}</Badge>
            )}
            {university.establishedYear && (
              <span className="text-sm">
                Established {university.establishedYear}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <RatingDisplay
              rating={Number(avgRating)}
              totalReviews={ratings?.length}
            />
            {university.websiteUrl && (
              <a
                href={university.websiteUrl}
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
        </div>
        <div className="shrink-0 lg:self-center">
          <RateButton
            entityName={university.name}
            categories={categories || []}
            isSubmitting={isSubmitting}
            onSubmit={handleRatingSubmit}
          >
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            Rate This University
          </RateButton>
        </div>
      </div>

      {/* Tabs */}
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
            {university.colleges && university.colleges.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {university.colleges.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {university.description && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {university.description}
                </p>
              </CardContent>
            </Card>
          )}

          {university.colleges && university.colleges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Colleges & Schools</CardTitle>
                <CardDescription>
                  This university has {university.colleges.length} colleges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {university.colleges.map((college) => (
                    <Card
                      key={college.id}
                      className="group cursor-pointer transition-colors hover:border-primary/50"
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/colleges/${college.slug}`}
                            className="block"
                          >
                            <div className="truncate font-medium group-hover:text-primary">
                              {college.name}
                            </div>
                          </Link>
                          {college.location && (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {college.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
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
              entityName={university.name}
              categories={categories || []}
              isSubmitting={isSubmitting}
              onSubmit={handleRatingSubmit}
            >
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              Rate This University
            </RateButton>
          </div>

          {!user && (
            <Card className="bg-muted/50">
              <CardContent className="py-6 text-center">
                <p className="mb-4 text-muted-foreground">
                  Sign in to rate this university and see detailed reviews
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
                  Be the first to rate this university!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="colleges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colleges & Schools</CardTitle>
              <CardDescription>
                Explore different colleges within {university.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {university.colleges && university.colleges.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {university.colleges.map((college: College) => (
                    <Card
                      key={college.id}
                      className="group cursor-pointer transition-colors hover:border-primary/50"
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <GraduationCap className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/colleges/${college.slug}`}
                            className="block"
                          >
                            <div className="truncate font-medium group-hover:text-primary">
                              {college.name}
                            </div>
                          </Link>
                          {college.location && (
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {college.location}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <GraduationCap className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
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
