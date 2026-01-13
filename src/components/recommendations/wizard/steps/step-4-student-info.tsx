"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserIcon, TrophyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Step4StudentInfoProps {
  data: {
    studentAchievements?: string;
    researchExperience?: string;
    academicPerformance?: string;
    personalQualities?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step4StudentInfo({ data, updateData }: Step4StudentInfoProps) {
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/recommendations/profile");
      if (response.ok) {
        const result = await response.json();
        setProfileData(result.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const useProfileData = (field: string, profileField: string) => {
    if (profileData?.[profileField] && !data[field as keyof typeof data]) {
      updateData(field, profileData[profileField]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileData && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">
                Profile data available for pre-filling
              </p>
              <div className="flex flex-wrap gap-2">
                {profileData.achievements && (
                  <Badge variant="secondary">Achievements</Badge>
                )}
                {profileData.skills && <Badge variant="secondary">Skills</Badge>}
                {profileData.projects && (
                  <Badge variant="secondary">Projects</Badge>
                )}
                {profileData.researchInterests && (
                  <Badge variant="secondary">Research</Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="studentAchievements">Achievements</Label>
              {profileData?.achievements && (
                <button
                  type="button"
                  onClick={() => useProfileData("studentAchievements", "achievements")}
                  className="text-xs text-primary hover:underline"
                >
                  Use profile data
                </button>
              )}
            </div>
            <Textarea
              id="studentAchievements"
              placeholder="e.g., Dean's list for 6 semesters, Best project award, Hackathon winner"
              value={data.studentAchievements || ""}
              onChange={(e) => updateData("studentAchievements", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="researchExperience">Research Experience</Label>
              {profileData?.projects && (
                <button
                  type="button"
                  onClick={() => useProfileData("researchExperience", "projects")}
                  className="text-xs text-primary hover:underline"
                >
                  Use profile data
                </button>
              )}
            </div>
            <Textarea
              id="researchExperience"
              placeholder="e.g., Published 2 papers in IEEE conferences, worked on AI research for 1 year"
              value={data.researchExperience || ""}
              onChange={(e) => updateData("researchExperience", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="academicPerformance">Academic Performance</Label>
              {profileData?.gpa && (
                <button
                  type="button"
                  onClick={() => useProfileData("academicPerformance", "gpa")}
                  className="text-xs text-primary hover:underline"
                >
                  Use profile data
                </button>
              )}
            </div>
            <Textarea
              id="academicPerformance"
              placeholder="e.g., GPA 3.8/4.0, consistently in top 5% of class, strong foundation in algorithms and data structures"
              value={data.academicPerformance || ""}
              onChange={(e) => updateData("academicPerformance", e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="personalQualities">Personal Qualities</Label>
              {profileData?.skills && (
                <button
                  type="button"
                  onClick={() => useProfileData("personalQualities", "skills")}
                  className="text-xs text-primary hover:underline"
                >
                  Use profile data
                </button>
              )}
            </div>
            <Textarea
              id="personalQualities"
              placeholder="e.g., Strong leadership skills, excellent team player, quick learner, problem solver"
              value={data.personalQualities || ""}
              onChange={(e) => updateData("personalQualities", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        These details help personalize your recommendation letter. All fields are
        optional - you can also customize these in the final review step.
      </p>
    </div>
  );
}
