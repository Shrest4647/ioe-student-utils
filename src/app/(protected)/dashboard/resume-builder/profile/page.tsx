"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileWizard } from "@/components/resume-builder/editor/profile-wizard";
import { apiClient } from "@/lib/eden";

export default function ProfileCreationPage() {
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.profiles.get();
      if (data?.success) {
        if (data.data) {
          setExistingProfile(data.data);
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleComplete = () => {
    toast.success("Profile completed successfully!");
    router.push("/dashboard/resume-builder/my-resumes");
  };

  if (isLoading) {
    return (
      <div className="fade-in container mx-auto max-w-6xl animate-in p-4 duration-500 md:p-8">
        <div className="flex min-h-96 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-4 text-muted-foreground text-sm">
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in container mx-auto max-w-6xl animate-in p-4 duration-500 md:p-8">
      <div className="mb-8">
        <h1 className="mb-2 font-bold text-3xl tracking-tight">
          {existingProfile ? "Edit Your Profile" : "Create Your Profile"}
        </h1>
        <p className="text-muted-foreground">
          {existingProfile
            ? "Update your profile information. Your profile will be used to generate resumes."
            : "Build your profile once, use it to create multiple resumes. This information will be the foundation for all your resumes."}
        </p>
      </div>

      <ProfileWizard
        initialData={existingProfile}
        onComplete={handleComplete}
      />
    </div>
  );
}
