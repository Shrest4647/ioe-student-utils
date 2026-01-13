"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EducationForm } from "@/components/resume-builder/forms/education-form";
import { LanguageSkillsForm } from "@/components/resume-builder/forms/language-skills-form";
import { PersonalInfoForm } from "@/components/resume-builder/forms/personal-info-form";
import { SkillsForm } from "@/components/resume-builder/forms/skills-form";
import { WorkExperienceForm } from "@/components/resume-builder/forms/work-experience-form";
import {
  EDUCATION_INSTRUCTIONS,
  InstructionsPanel,
  LANGUAGE_SKILLS_INSTRUCTIONS,
  PROFILE_INSTRUCTIONS,
  SKILLS_INSTRUCTIONS,
  WORK_EXPERIENCE_INSTRUCTIONS,
} from "@/components/resume-builder/shared/instructions-panel";
import {
  type Step,
  Stepper,
  StepperNav,
} from "@/components/resume-builder/shared/stepper";

interface ProfileWizardProps {
  initialData?: any;
  onComplete?: () => void;
}

const STEPS: Step[] = [
  {
    id: "personal-info",
    label: "Personal Info",
    description: "Basic information",
  },
  {
    id: "work-experience",
    label: "Work Experience",
    description: "Employment history",
  },
  {
    id: "education",
    label: "Education",
    description: "Academic background",
  },
  {
    id: "language-skills",
    label: "Language Skills",
    description: "Known languages",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Professional skills",
  },
];

export function ProfileWizard({ initialData, onComplete }: ProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCompletedSteps(new Set([...completedSteps, currentStep]));
      setCurrentStep(currentStep + 1);
    } else {
      // Complete - save all data and finish
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success("Profile created successfully!");
    onComplete?.();
  };

  const getCurrentInstructions = () => {
    switch (STEPS[currentStep].id) {
      case "personal-info":
        return PROFILE_INSTRUCTIONS;
      case "work-experience":
        return WORK_EXPERIENCE_INSTRUCTIONS;
      case "education":
        return EDUCATION_INSTRUCTIONS;
      case "language-skills":
        return LANGUAGE_SKILLS_INSTRUCTIONS;
      case "skills":
        return SKILLS_INSTRUCTIONS;
      default:
        return [];
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column - Instructions */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          <InstructionsPanel instructions={getCurrentInstructions()} />
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="space-y-6 lg:col-span-2">
        {/* Stepper */}
        <div className="overflow-x-auto">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {currentStep === 0 && (
            <PersonalInfoForm initialData={initialData} onSave={handleNext} />
          )}

          {currentStep === 1 && <WorkExperienceForm onSave={handleNext} />}

          {currentStep === 2 && <EducationForm onSave={handleNext} />}

          {currentStep === 3 && <LanguageSkillsForm onSave={handleNext} />}

          {currentStep === 4 && <SkillsForm onSave={handleNext} />}
        </div>

        {/* Navigation - Only show if form doesn't have its own */}
        {currentStep !== 0 && (
          <StepperNav
            currentStep={currentStep}
            totalSteps={STEPS.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            canGoPrevious={currentStep > 0}
            canGoNext={completedSteps.has(currentStep) || currentStep === 0}
            nextLabel={
              currentStep === STEPS.length - 1 ? "Complete Profile" : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
