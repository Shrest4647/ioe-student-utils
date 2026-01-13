"use client";

import { ArrowLeftIcon, DownloadIcon, EditIcon } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { LetterPreview } from "@/components/recommendations/letter-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LetterDetailPage({ params }: PageProps) {
  const { id } = use(params);

  // TODO: Fetch letter data from API
  // const { data: letter, isLoading } = useLetter(id);

  // if (isLoading) {
  //   return <div>Loading...</div>;
  // }

  // if (!letter) {
  //   notFound();
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/recommendations">
            <Button variant="ghost" size="icon">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              PhD Recommendation - Stanford
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">Draft</Badge>
              <p className="text-muted-foreground text-sm">
                Created on Jan 13, 2025
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Letter Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Letter Preview</CardTitle>
          <CardDescription>
            Review your recommendation letter before downloading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LetterPreview letterId={id} />
        </CardContent>
      </Card>

      {/* Letter Metadata */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recommender Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> Dr. John Smith
            </div>
            <div>
              <span className="font-medium">Title:</span> Professor of Computer
              Science
            </div>
            <div>
              <span className="font-medium">Institution:</span> IOE
            </div>
            <div>
              <span className="font-medium">Department:</span> Computer
              Engineering
            </div>
            <div>
              <span className="font-medium">Email:</span> john.smith@ioe.edu.np
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Institution:</span> Stanford
              University
            </div>
            <div>
              <span className="font-medium">Program:</span> PhD in Computer
              Science
            </div>
            <div>
              <span className="font-medium">Country:</span> USA
            </div>
            <div>
              <span className="font-medium">Purpose:</span> Admission
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
