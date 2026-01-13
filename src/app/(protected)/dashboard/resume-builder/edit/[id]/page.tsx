"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ResumeEditor } from "@/components/resume-builder/editor/resume-editor";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/eden";

export default function EditResumePage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);
  const [resumeName, setResumeName] = useState("");

  const fetchResumeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.resumes({ id: resumeId }).get();
      if (data?.success && data.data) {
        setResumeData(data.data);
        setResumeName(data.data.name || "");
      } else {
        toast.error("Failed to load resume");
        router.push("/dashboard/resume-builder/my-resumes");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("An error occurred");
      router.push("/dashboard/resume-builder/my-resumes");
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, router]);

  useEffect(() => {
    if (resumeId) {
      fetchResumeData();
    }
  }, [resumeId, fetchResumeData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-4 text-muted-foreground text-sm">
            Loading resume...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in container mx-auto max-w-7xl animate-in p-4 duration-500 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/resume-builder/my-resumes")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            {resumeName || "Edit Resume"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Customize your resume sections and preview in real-time
          </p>
        </div>
      </div>

      <ResumeEditor
        resumeId={resumeId}
        initialData={resumeData}
        onSave={() => {
          toast.success("Resume saved successfully!");
          fetchResumeData();
        }}
      />
    </div>
  );
}
