"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface SectionConfig {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
}

interface SectionSelectorProps {
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
}

export function SectionSelector({ sections, onSectionsChange }: SectionSelectorProps) {
  const [allSelected, setAllSelected] = useState(false);

  const handleToggle = (sectionId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId && !s.required ? { ...s, checked: !s.checked } : s
    );
    onSectionsChange(updated);
  };

  const handleSelectAll = () => {
    const updated = sections.map((s) =>
      s.required ? s : { ...s, checked: !allSelected }
    );
    onSectionsChange(updated);
    setAllSelected(!allSelected);
  };

  const groupedSections = {
    required: sections.filter((s) => s.required),
    core: sections.filter((s) => !s.required && ["work-experience", "education"].includes(s.id)),
    skills: sections.filter((s) => !s.required && ["language-skills", "skills"].includes(s.id)),
    optional: sections.filter((s) => !s.required && !["work-experience", "education", "language-skills", "skills"].includes(s.id)),
  };

  const optionalCount = sections.filter((s) => !s.required).length;
  const selectedCount = sections.filter((s) => s.checked).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Resume Sections</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Choose which sections to include in your resume ({selectedCount} of {optionalCount} optional sections selected)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Section */}
        {groupedSections.required.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Required</h3>
            {groupedSections.required.map((section) => (
              <div key={section.id} className="flex items-start space-x-3 opacity-60">
                <Checkbox
                  id={section.id}
                  checked={section.checked}
                  disabled
                />
                <div className="flex-1">
                  <Label htmlFor={section.id} className="cursor-pointer font-medium">
                    {section.label}
                  </Label>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Core Sections */}
        {groupedSections.core.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Core Sections</h3>
            {groupedSections.core.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={section.checked}
                  onCheckedChange={() => handleToggle(section.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={section.id} className="cursor-pointer font-medium">
                    {section.label}
                  </Label>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {groupedSections.skills.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Skills</h3>
            {groupedSections.skills.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={section.checked}
                  onCheckedChange={() => handleToggle(section.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={section.id} className="cursor-pointer font-medium">
                    {section.label}
                  </Label>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Optional Sections */}
        {groupedSections.optional.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Optional</h3>
            {groupedSections.optional.map((section) => (
              <div key={section.id} className="flex items-start space-x-3">
                <Checkbox
                  id={section.id}
                  checked={section.checked}
                  onCheckedChange={() => handleToggle(section.id)}
                />
                <div className="flex-1">
                  <Label htmlFor={section.id} className="cursor-pointer font-medium">
                    {section.label}
                  </Label>
                  <p className="text-muted-foreground text-sm">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const DEFAULT_SECTION_CONFIGS: SectionConfig[] = [
  {
    id: "personal-info",
    label: "Personal Information",
    description: "Your name, contact details, and professional summary",
    required: true,
    checked: true,
  },
  {
    id: "work-experience",
    label: "Work Experience",
    description: "Your employment history and professional achievements",
    required: false,
    checked: true,
  },
  {
    id: "education",
    label: "Education",
    description: "Academic qualifications and certifications",
    required: false,
    checked: true,
  },
  {
    id: "language-skills",
    label: "Language Skills",
    description: "Languages you know with CEFR proficiency levels",
    required: false,
    checked: true,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Technical, professional, and soft skills",
    required: false,
    checked: true,
  },
];
