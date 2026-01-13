"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_SECTION_CONFIGS,
  type SectionConfig,
  SectionSelector,
} from "@/components/resume-builder/shared/section-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/eden";

export default function CreateResumePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_hasProfile, setHasProfile] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>(
    DEFAULT_SECTION_CONFIGS,
  );

  const checkProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.profiles.get();
      if (data?.success && data.data) {
        setHasProfile(true);
      } else {
        toast.error("Please create a profile first");
        router.push("/dashboard/resume-builder/profile");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to check profile");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkProfile();
  }, [checkProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resumeName.trim()) {
      toast.error("Please enter a resume name");
      return;
    }

    const selectedSections = sections.filter((s) => s.checked);
    if (selectedSections.length === 0) {
      toast.error("Please select at least one section");
      return;
    }

    setIsSubmitting(true);
    try {
      const includedSections = selectedSections.map((s) => ({
        id: s.id,
        label: s.label,
        order: sections.indexOf(s),
      }));

      const { data, error } = await apiClient.api.resumes.post({
        name: resumeName,
        includedSections,
      });

      if (error) {
        toast.error("Failed to create resume");
      } else if (data?.success && data.data) {
        toast.success("Resume created successfully!");
        router.push(`/dashboard/resume-builder/edit/${data.data.id}`);
      }
    } catch (err) {
      console.error("Submit Error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-4 text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in container mx-auto max-w-3xl animate-in p-4 duration-500 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl tracking-tight">
          Create New Resume
        </h1>
        <p className="text-muted-foreground">
          Create a new resume from your profile data. You can customize which
          sections to include.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resume Name */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">
                Resume Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Software Developer Resume - Tech Company"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                required
              />
              <p className="text-muted-foreground text-xs">
                Give your resume a name to help you identify it later
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section Selection */}
        <SectionSelector sections={sections} onSectionsChange={setSections} />

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Resume"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
