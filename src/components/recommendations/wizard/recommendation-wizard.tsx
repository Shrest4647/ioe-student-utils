"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import { Step1TemplateInfo } from "./steps/step-1-template-info";
import { Step2RecommenderInfo } from "./steps/step-2-recommender-info";
import { Step3TargetInfo } from "./steps/step-3-target-info";
import { Step4StudentInfo } from "./steps/step-4-student-info";
import { Step5CustomContent } from "./steps/step-5-custom-content";
import { Step6ReviewEdit } from "./steps/step-6-review-edit";

interface WizardData {
  // Template info (from step 1)
  templateId: string;

  // Recommender info (step 2)
  recommenderName: string;
  recommenderTitle: string;
  recommenderInstitution: string;
  recommenderEmail?: string;
  recommenderDepartment?: string;

  // Target info (step 3)
  targetInstitution: string;
  targetProgram: string;
  targetDepartment?: string;
  targetCountry: string;
  purpose: string;

  // Relationship (step 3)
  relationship: string;
  contextOfMeeting?: string;

  // Student info (step 4)
  studentAchievements?: string;
  researchExperience?: string;
  academicPerformance?: string;
  personalQualities?: string;

  // Custom content (step 5)
  customContent?: string;
}

const steps = [
  { id: 1, title: "Template Info", description: "Review your selection" },
  { id: 2, title: "Recommender", description: "Who is recommending you?" },
  { id: 3, title: "Target", description: "Where are you applying?" },
  { id: 4, title: "Student Info", description: "Your achievements" },
  { id: 5, title: "Custom Content", description: "Add extra details" },
  { id: 6, title: "Review", description: "Review and edit" },
];

export function RecommendationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({
    templateId: templateId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!templateId) {
      toast.error("No template selected. Please choose a template first.");
      router.push("/dashboard/recommendations");
    }
  }, [templateId, router]);

  const updateData = (field: keyof WizardData, value: string) => {
    setWizardData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    // Validation for each step
    if (currentStep === 2) {
      if (
        !wizardData.recommenderName ||
        !wizardData.recommenderTitle ||
        !wizardData.recommenderInstitution
      ) {
        toast.error("Please fill in all required recommender fields");
        return;
      }
    }

    if (currentStep === 3) {
      if (
        !wizardData.targetInstitution ||
        !wizardData.targetProgram ||
        !wizardData.targetCountry ||
        !wizardData.purpose ||
        !wizardData.relationship
      ) {
        toast.error("Please fill in all required target fields");
        return;
      }
    }

    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const response = await fetch("/api/recommendations/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: wizardData.templateId,
          title: `${wizardData.targetProgram} - ${wizardData.targetInstitution}`,
          ...wizardData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create letter");
      }

      const data = await response.json();
      toast.success("Recommendation letter created successfully!");

      // Redirect to the letter detail page
      router.push(`/dashboard/recommendations/${data.data.id}`);
    } catch (error) {
      console.error("Error creating letter:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create letter",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 6) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1TemplateInfo templateId={wizardData.templateId!} />;
      case 2:
        return (
          <Step2RecommenderInfo
            data={wizardData}
            updateData={updateData}
          />
        );
      case 3:
        return <Step3TargetInfo data={wizardData} updateData={updateData} />;
      case 4:
        return <Step4StudentInfo data={wizardData} updateData={updateData} />;
      case 5:
        return (
          <Step5CustomContent data={wizardData} updateData={updateData} />
        );
      case 6:
        return (
          <Step6ReviewEdit
            data={wizardData}
            updateData={updateData}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Create Recommendation Letter
        </h1>
        <p className="text-muted-foreground">
          Follow the steps to create your personalized recommendation letter
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Step {currentStep} of 6</span>
              <span className="text-muted-foreground">
                {steps[currentStep - 1].title}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {steps.map((step) => (
                <span
                  key={step.id}
                  className={step.id === currentStep ? "font-medium" : ""}
                >
                  {step.id}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 6 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === 5 ? "Review" : "Next"}
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
