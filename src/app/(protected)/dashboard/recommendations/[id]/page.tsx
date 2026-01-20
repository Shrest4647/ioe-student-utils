"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  DownloadIcon,
  EditIcon,
  LoaderIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { apiClient } from "@/lib/eden";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LetterDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const {
    data: letter,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recommendation-letter", id],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations
        .letters({
          id,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch letter");
      }

      return data?.data;
    },
  });

  const handleEdit = () => {
    router.push(`/dashboard/recommendations/${id}/edit`);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/recommendations/letters/${id}/download`,
      );
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${letter?.title || "recommendation-letter"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Letter not found</p>
        <Link href="/dashboard/recommendations">
          <Button variant="outline" className="mt-4">
            Back to Letters
          </Button>
        </Link>
      </div>
    );
  }

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
              {letter.title}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{letter.status}</Badge>
              <p className="text-muted-foreground text-sm">
                Created on {new Date(letter.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <EditIcon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button onClick={handleDownload}>
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
              <span className="font-medium">Name:</span>{" "}
              {letter.recommenderName}
            </div>
            <div>
              <span className="font-medium">Title:</span>{" "}
              {letter.recommenderTitle}
            </div>
            <div>
              <span className="font-medium">Institution:</span>{" "}
              {letter.recommenderInstitution}
            </div>
            {letter.recommenderDepartment && (
              <div>
                <span className="font-medium">Department:</span>{" "}
                {letter.recommenderDepartment}
              </div>
            )}
            {letter.recommenderEmail && (
              <div>
                <span className="font-medium">Email:</span>{" "}
                {letter.recommenderEmail}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Institution:</span>{" "}
              {letter.targetInstitution}
            </div>
            <div>
              <span className="font-medium">Program:</span>{" "}
              {letter.targetProgram}
            </div>
            {letter.targetDepartment && (
              <div>
                <span className="font-medium">Department:</span>{" "}
                {letter.targetDepartment}
              </div>
            )}
            <div>
              <span className="font-medium">Country:</span>{" "}
              {letter.targetCountry}
            </div>
            <div>
              <span className="font-medium">Purpose:</span> {letter.purpose}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
