"use client";

import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { LetterList } from "@/components/recommendations/letter-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/eden";

export default function RecommendationsPage() {
  const router = useRouter();

  const { data: letters = [], isLoading: statsLoading, error } = useQuery({
    queryKey: ["recommendation-letters", "all"],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations.letters.get();

      if (error) {
        console.error("Error fetching letters:", error);
        throw new Error("Failed to fetch letters");
      }

      console.log("Letters data received:", data?.data);
      return data?.data || [];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load recommendation letters");
    }
  }, [error]);

  // Safely compute stats with optional chaining
  const totalLetters = Array.isArray(letters) ? letters.length : 0;
  const draftLetters = Array.isArray(letters)
    ? letters.filter((l) => l?.status === "draft").length
    : 0;
  const completedLetters = Array.isArray(letters)
    ? letters.filter((l) => l?.status === "completed").length
    : 0;

  // Debug logging
  useEffect(() => {
    console.log("Stats updated:", {
      total: totalLetters,
      drafts: draftLetters,
      completed: completedLetters,
      lettersData: letters,
    });
  }, [letters, totalLetters, draftLetters, completedLetters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Recommendation Letters
          </h1>
          <p className="text-muted-foreground">
            Create and manage your recommendation letters
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/recommendations/new")}
          size="lg"
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          Create New Letter
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Letters</CardTitle>
            <FileTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{totalLetters}</div>
            )}
            <p className="text-muted-foreground text-xs">
              All recommendation letters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{draftLetters}</div>
            )}
            <p className="text-muted-foreground text-xs">Letters in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-bold text-2xl">{completedLetters}</div>
            )}
            <p className="text-muted-foreground text-xs">Ready to use</p>
          </CardContent>
        </Card>
      </div>

      {/* Letters List */}
      <LetterList />
    </div>
  );
}
