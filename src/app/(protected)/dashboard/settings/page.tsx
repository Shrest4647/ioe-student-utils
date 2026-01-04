"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DangerZoneSection } from "@/components/settings/danger-zone-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { SocialAccountsSection } from "@/components/settings/social-accounts-section";
import { useSession } from "@/lib/auth-client";
import { apiClient } from "@/lib/eden";

export default function SettingsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    bio?: string;
    location?: string;
  }>({});

  // Fetch profile data on mount
  useEffect(() => {
    if (session?.user) {
      apiClient.api.user.profile
        .get()
        .then(({ data, error }) => {
          if (error) throw error;
          if (data?.success) {
            setProfileData({
              bio: data.data?.bio ?? "",
              location: data.data?.location ?? "",
            });
          }
        })
        .catch(console.error)
        .finally(() => setProfileLoading(false));
    }
  }, [session?.user]);

  // Show loading state while session is loading
  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, security, and account preferences
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection
          user={session.user}
          profileData={profileData}
          isLoading={profileLoading}
        />
        <SocialAccountsSection />
        <SecuritySection />
        <DangerZoneSection />
      </div>
    </div>
  );
}
