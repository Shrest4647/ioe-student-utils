"use client";

import {
  Building2,
  ExternalLink,
  Globe,
  GraduationCap,
  Loader2,
  MapPin,
} from "lucide-react";
import Image from "next/image";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useRatingCategories,
  useUniversityRatings,
} from "@/hooks/use-universities";
import { RatingCard } from "./rating-card";
import { RatingDialog } from "./rating-dialog";
import { RatingDisplay } from "./rating-display";
import type { University } from "./university-card";

interface UniversityDetailProps {
  university: University & { colleges: any[] };
  user: any;
}

export function UniversityDetail({ university, user }: UniversityDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "ratings" | "colleges"
  >("overview");
  const [showRatingDialog, setShowRatingDialog] = useState(false);
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
    title: string;
    review: string;
  }) => {
    if (!user) {
      toast.error("Please sign in to rate this university");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "university",
          entityId: university.id,
          categoryId: data.categoryId,
          rating: data.rating,
          title: data.title,
          review: data.review,
        }),
      });

      if (response.ok) {
        toast.success("Review submitted successfully!");
        setShowRatingDialog(false);
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
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl bg-muted">
          {university.logoUrl ? (
            <Image
              src={university.logoUrl}
              alt={university.name}
              className="h-24 w-24 object-contain"
            />
          ) : (
            <Building2 className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-4xl text-transparent tracking-tight">
            {university.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
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
          <div className="flex items-center gap-2">
            <RatingDisplay
              rating={Number(avgRating)}
              totalReviews={ratings?.length}
            />
          </div>
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

      {/* Rating Dialog */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        entityName={university.name}
        categories={categories || []}
        onSubmit={handleRatingSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v: any) => setActiveTab(v)}
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
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {university.colleges.map((college: any) => (
                    <div
                      key={college.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/50"
                    >
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{college.name}</div>
                        {college.location && (
                          <div className="text-muted-foreground text-sm">
                            {college.location}
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
            <Button onClick={() => setShowRatingDialog(true)}>
              Rate This University
            </Button>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {university.colleges.map((college: any) => (
                    <Card key={college.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {college.name}
                        </CardTitle>
                        {college.location && (
                          <CardDescription className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {college.location}
                          </CardDescription>
                        )}
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
