"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionNav, DEFAULT_SECTIONS, Section } from "@/components/resume-builder/editor/section-nav";
import { ResumePreview } from "@/components/resume-builder/preview/resume-preview";
import { PersonalInfoForm } from "@/components/resume-builder/forms/personal-info-form";
import { WorkExperienceForm } from "@/components/resume-builder/forms/work-experience-form";
import { EducationForm } from "@/components/resume-builder/forms/education-form";
import { LanguageSkillsForm } from "@/components/resume-builder/forms/language-skills-form";
import { SkillsForm } from "@/components/resume-builder/forms/skills-form";

interface ResumeEditorProps {
  resumeId: string;
  initialData?: any;
  onSave?: () => void;
}

export function ResumeEditor({ resumeId, initialData, onSave }: ResumeEditorProps) {
  const [activeSection, setActiveSection] = useState("personal-info");
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log("Download PDF clicked");
  };

  const renderActiveSection = () => {
    const profile = initialData?.profile;

    switch (activeSection) {
      case "personal-info":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Personal Information</h2>
            <PersonalInfoForm initialData={profile} onSave={onSave} />
          </div>
        );

      case "work-experience":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Work Experience</h2>
            <WorkExperienceForm onSave={onSave} />
          </div>
        );

      case "education":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Education</h2>
            <EducationForm onSave={onSave} />
          </div>
        );

      case "language-skills":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Language Skills</h2>
            <LanguageSkillsForm onSave={onSave} />
          </div>
        );

      case "skills":
        return (
          <div>
            <h2 className="mb-4 font-semibold text-xl">Skills</h2>
            <SkillsForm onSave={onSave} />
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
        <Card className="sticky top-4 p-4">
          <h3 className="mb-4 font-semibold">Sections</h3>
          <SectionNav
            sections={sections}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </Card>
      </div>

      {/* Middle Column - Editor */}
      <div className="lg:col-span-2">
        <div className="space-y-6">
          {renderActiveSection()}
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:col-span-2">
        <div className="sticky top-4">
          <ResumePreview
            resumeData={initialData}
            onDownloadPDF={handleDownloadPDF}
          />
        </div>
      </div>
    </div>
  );
}
