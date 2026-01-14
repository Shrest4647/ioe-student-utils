"use client";

import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  label: string;
  isCompleted: boolean;
  isRequired: boolean;
}

interface SectionNavProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function SectionNav({
  sections,
  activeSection,
  onSectionChange,
}: SectionNavProps) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;

        return (
          <Button
            key={section.id}
            type="button"
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              isActive && "bg-muted font-semibold",
            )}
            onClick={() => onSectionChange(section.id)}
          >
            {section.isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="flex-1 text-left">{section.label}</span>
            {section.isRequired && (
              <span className="text-muted-foreground text-xs">*</span>
            )}
            <ChevronRight className="h-4 w-4 opacity-50" />
          </Button>
        );
      })}
    </nav>
  );
}

export const DEFAULT_SECTIONS: Section[] = [
  {
    id: "personal-info",
    label: "Personal Information",
    isCompleted: false,
    isRequired: true,
  },
  {
    id: "work-experience",
    label: "Work Experience",
    isCompleted: false,
    isRequired: false,
  },
  {
    id: "education",
    label: "Education",
    isCompleted: false,
    isRequired: false,
  },
  {
    id: "language-skills",
    label: "Language Skills",
    isCompleted: false,
    isRequired: false,
  },
  { id: "skills", label: "Skills", isCompleted: false, isRequired: false },
  {
    id: "projects",
    label: "Projects",
    isCompleted: false,
    isRequired: false,
  },
  {
    id: "positions",
    label: "Positions of Responsibility",
    isCompleted: false,
    isRequired: false,
  },
  {
    id: "certifications",
    label: "Awards & Certifications",
    isCompleted: false,
    isRequired: false,
  },
];
