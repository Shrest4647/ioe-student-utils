"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_SECTIONS,
  type Section,
  SectionNav,
} from "@/components/resume-builder/editor/section-nav";
import { CertificationsForm } from "@/components/resume-builder/forms/certifications-form";
import { EducationForm } from "@/components/resume-builder/forms/education-form";
import { LanguageSkillsForm } from "@/components/resume-builder/forms/language-skills-form";
import { PersonalInfoForm } from "@/components/resume-builder/forms/personal-info-form";
import { PositionsForm } from "@/components/resume-builder/forms/positions-form";
import { ProjectsForm } from "@/components/resume-builder/forms/projects-form";
import { SkillsForm } from "@/components/resume-builder/forms/skills-form";
import { WorkExperienceForm } from "@/components/resume-builder/forms/work-experience-form";
import { ResumePreview } from "@/components/resume-builder/preview/resume-preview";
import type { ResumeData } from "@/components/resume-builder/shared/resume-types";
import { Card } from "@/components/ui/card";
import { apiClient } from "@/lib/eden";

interface ResumeEditorProps {
  resumeId: string;
  initialData?: any;
  onSave?: () => void;
}

export function ResumeEditor({ initialData, onSave }: ResumeEditorProps) {
  const [activeSection, setActiveSection] = useState("personal-info");
  const [sections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [resumeData, setResumeData] = useState<ResumeData | undefined>(
    initialData ? { profile: initialData } : undefined,
  );

  const fetchFullResumeData = useCallback(async () => {
    try {
      const [
        profileRes,
        educationRes,
        workRes,
        skillsRes,
        projectsRes,
        languagesRes,
        positionsRes,
        certificationsRes,
      ] = await Promise.all([
        apiClient.api.profiles.get(),
        apiClient.api.education.get(),
        apiClient.api["work-experiences"].get(),
        apiClient.api.skills.get(),
        apiClient.api.projects.get(),
        apiClient.api["language-skills"].get(),
        apiClient.api.positions.get(),
        apiClient.api.certifications.get(),
      ]);

      setResumeData((prev) => ({
        ...prev,
        profile: profileRes.data?.success
          ? (profileRes.data.data as any)
          : prev?.profile,
        educationRecords: educationRes.data?.success
          ? (educationRes.data.data as any)
          : prev?.educationRecords,
        workExperiences: workRes.data?.success
          ? (workRes.data.data as any)
          : prev?.workExperiences,
        userSkills: skillsRes.data?.success
          ? (skillsRes.data.data as any)
          : prev?.userSkills,
        projectRecords: projectsRes.data?.success
          ? (projectsRes.data.data as any)
          : prev?.projectRecords,
        languageSkills: languagesRes.data?.success
          ? (languagesRes.data.data as any)
          : prev?.languageSkills,
        positionsOfResponsibilityRecords: positionsRes.data?.success
          ? (positionsRes.data.data as any)
          : prev?.positionsOfResponsibilityRecords,
        certificationsRecords: certificationsRes.data?.success
          ? (certificationsRes.data.data as any)
          : prev?.certificationsRecords,
      }));
    } catch (error) {
      console.error("Failed to fetch resume data", error);
    }
  }, []);

  useEffect(() => {
    fetchFullResumeData();
  }, [fetchFullResumeData]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const onFormSave = () => {
    fetchFullResumeData();
    onSave?.();
  };

  const renderActiveSection = () => {
    const profile = initialData?.profile || resumeData?.profile;

    switch (activeSection) {
      case "personal-info":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Personal Information</h2>
            <PersonalInfoForm
              initialData={profile}
              onSave={onFormSave}
              // PersonalInfoForm might update profile, so we refresh
            />
          </div>
        );

      case "work-experience":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Work Experience</h2>
            <WorkExperienceForm
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "education":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Education</h2>
            <EducationForm
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "language-skills":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Language Skills</h2>
            <LanguageSkillsForm
              initialData={resumeData?.languageSkills?.map((lang) => ({
                id: lang.id || "",
                language: lang.language || "",
                listening: lang.listening || "",
                reading: lang.reading || "",
                speaking: lang.speaking || "",
                writing: lang.writing || "",
              }))}
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "skills":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Skills</h2>
            <SkillsForm
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "projects":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Projects</h2>
            <ProjectsForm
              initialData={resumeData?.projectRecords?.map((project) => ({
                id: project.id || "",
                name: project.name || "",
                role: project.role || "",
                description: project.description || "",
                startDate: project.startDate || "",
                endDate: project.endDate || "",
                referenceLink: project.referenceLink || "",
              }))}
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "positions":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">
              Positions of Responsibility
            </h2>
            <PositionsForm
              initialData={resumeData?.positionsOfResponsibilityRecords?.map(
                (position) => ({
                  id: position.id || "",
                  name: position.name || "",
                  description: position.description || "",
                  startDate: position.startDate || "",
                  endDate: position.endDate || "",
                  referenceLink: position.referenceLink || "",
                }),
              )}
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      case "certifications":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">
              Awards & Certifications
            </h2>
            <CertificationsForm
              initialData={resumeData?.certificationsRecords?.map((cert) => ({
                id: cert.id || "",
                name: cert.name || "",
                issuer: cert.issuer || "",
                issueDate: cert.issueDate || "",
                credentialUrl: cert.credentialUrl || "",
              }))}
              onSave={onFormSave}
              onDataChange={fetchFullResumeData}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Left Column - Section Navigation */}
      <div className="lg:col-span-1">
        <h2 className="mb-4 font-semibold text-xl">Sections</h2>
        <Card className="sticky top-4 p-4">
          <SectionNav
            sections={sections}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </Card>
      </div>

      {/* Middle Column - Editor */}
      <div className="lg:col-span-2">
        <div className="space-y-6">{renderActiveSection()}</div>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:col-span-2">
        <div className="sticky top-4">
          <ResumePreview
            resumeData={resumeData}
            resumeName={`${resumeData?.profile?.firstName || ""} ${resumeData?.profile?.lastName || ""}`}
          />
        </div>
      </div>
    </div>
  );
}
