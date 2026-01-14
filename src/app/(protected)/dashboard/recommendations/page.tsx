"use client";

import { FileTextIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { LetterList } from "@/components/recommendations/letter-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecommendationsPage() {
  const router = useRouter();

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
        <Button onClick={() => router.push("/dashboard/recommendations/new")} size="lg">
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
            <div className="font-bold text-2xl">-</div>
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
            <div className="font-bold text-2xl">-</div>
            <p className="text-muted-foreground text-xs">Letters in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">-</div>
            <p className="text-muted-foreground text-xs">Ready to use</p>
          </CardContent>
        </Card>
      </div>

      {/* Letters List */}
      <LetterList />
    </div>
  );
}
