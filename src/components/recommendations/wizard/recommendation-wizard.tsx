"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/eden";
import { Step0TemplateSelection } from "./steps/step-0-template-selection";

import { Step2RecommenderInfo } from "./steps/step-2-recommender-info";
import { Step3TargetInfo } from "./steps/step-3-target-info";
import { Step4TemplateVariables } from "./steps/step-4-template-variables";
import { Step6CustomContent } from "./steps/step-6-custom-content";
import { Step7ReviewEdit } from "./steps/step-7-review-edit";

interface WizardData {
  // Template info (from step 1)
  templateId: string;

  // Recommender info (step 2)
  recommenderName: string;
  recommenderTitle: string;
  recommenderInstitution: string;
  recommenderEmail?: string;
  recommenderDepartment?: string;
  recommenderPhone?: string;
  relationship: string;
  contextOfMeeting?: string;
  savedRecommenderId?: string;

  // Target info (step 3)
  targetInstitution: string;
  targetProgram: string;
  targetDepartment?: string;
  targetCountry: string;
  purpose: string;
  savedInstitutionId?: string;

  // Student info (step 4)
  studentAchievements?: string;
  researchExperience?: string;
  academicPerformance?: string;
  personalQualities?: string;

  // Template variables (step 4) - dynamic fields from template
  [key: string]: string | undefined;

  // Custom content (step 5)
  customContent?: string;

  // Final content (step 6)
  finalContent?: string;
}

interface RecommendationWizardProps {
  editMode?: boolean;
  letterId?: string;
}

/**
 * Render a multi-step wizard for creating or editing a recommendation letter.
 *
 * @param editMode - If true, preload the existing letter (when `letterId` is provided) and skip the template selection step.
 * @param letterId - The ID of the letter to load when editing; ignored when `editMode` is false or unset.
 * @returns The wizard UI that guides the user through template selection, recommender and target details, template variables, custom content, and final review.
 */
export function RecommendationWizard({
  editMode,
  letterId,
}: RecommendationWizardProps = {}) {
  const getSteps = () => {
    const baseSteps = [
      { id: 1, title: "Choose Template", description: "Select a template" },
      { id: 2, title: "Recommender", description: "Who is recommending you?" },
      { id: 3, title: "Target", description: "Where are you applying?" },
      {
        id: 4,
        title: "Template Details",
        description: "Fill in template variables",
      },
      { id: 5, title: "Custom Content", description: "Add extra details" },
      { id: 6, title: "Review", description: "Review and edit" },
    ];

    // Skip template selection step in edit mode
    if (editMode) {
      return baseSteps.slice(1);
    }

    return baseSteps;
  };

  const steps = getSteps();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [currentStep, setCurrentStep] = useState(editMode ? 2 : 1); // Skip template selection in edit mode

  // Helper function to get the current step object
  const getCurrentStepObject = () => {
    return steps.find((step) => step.id === currentStep) || steps[0];
  };
  const [wizardData, setWizardData] = useState<Partial<WizardData>>(
    editMode ? {} : templateId ? { templateId } : {},
  );

  // Fetch letter data if in edit mode
  const { data: existingLetter } = useQuery({
    queryKey: ["recommendation-letter", letterId],
    queryFn: async () => {
      if (!editMode || !letterId) return null;

      const { data, error } = await apiClient.api.recommendations
        .letters({
          id: letterId,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch letter");
      }

      return data?.data;
    },
    enabled: editMode && !!letterId,
  });

  // Fetch template for validation
  const { data: template } = useQuery({
    queryKey: ["recommendation-template", wizardData.templateId],
    queryFn: async () => {
      if (!wizardData.templateId) return null;

      const { data, error } = await apiClient.api.recommendations
        .templates({
          id: wizardData.templateId,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch template");
      }

      return data?.data;
    },
    enabled: !!wizardData.templateId,
  });

  // Pre-fill wizard data when editing
  useEffect(() => {
    if (editMode && existingLetter) {
      setWizardData({
        templateId: existingLetter.templateId,
        recommenderName: existingLetter.recommenderName,
        recommenderTitle: existingLetter.recommenderTitle,
        recommenderInstitution: existingLetter.recommenderInstitution,
        recommenderEmail: existingLetter.recommenderEmail ?? undefined,
        recommenderDepartment:
          existingLetter.recommenderDepartment ?? undefined,
        relationship: existingLetter.relationship,
        contextOfMeeting: existingLetter.contextOfMeeting ?? undefined,
        targetInstitution: existingLetter.targetInstitution,
        targetProgram: existingLetter.targetProgram,
        targetDepartment: existingLetter.targetDepartment ?? undefined,
        targetCountry: existingLetter.targetCountry,
        purpose: existingLetter.purpose,
        studentAchievements: existingLetter.studentAchievements ?? undefined,
        researchExperience: existingLetter.researchExperience ?? undefined,
        academicPerformance: existingLetter.academicPerformance ?? undefined,
        personalQualities: existingLetter.personalQualities ?? undefined,
        customContent: existingLetter.customContent ?? undefined,
        finalContent: existingLetter.finalContent,
      });
    }
  }, [editMode, existingLetter]);

  const updateData = useCallback((field: string, value: string) => {
    setWizardData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = async () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!wizardData.templateId) {
        toast.error("Please select a template to continue");
        return;
      }
    }

    if (currentStep === 2) {
      if (
        !wizardData.recommenderName ||
        !wizardData.recommenderTitle ||
        !wizardData.recommenderInstitution ||
        !wizardData.relationship
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
        !wizardData.purpose
      ) {
        toast.error("Please fill in all required target fields");
        return;
      }
    }

    if (currentStep === 4) {
      // Step 4 validation - check required template variables
      if (template?.variables) {
        const requiredFields = template.variables
          .filter((v) => v.required)
          .map((v) => v.name);

        const missingFields = requiredFields.filter(
          (field) => !wizardData[field] || wizardData[field]?.trim() === "",
        );

        if (missingFields.length > 0) {
          toast.error(
            `Please fill in all required template fields. Missing: ${missingFields.length} required field(s)`,
          );
          return;
        }
      }
    }

    if (currentStep < Math.max(...steps.map((s) => s.id))) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > Math.min(...steps.map((s) => s.id))) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const letterMutation = useMutation({
    mutationFn: async () => {
      // Extract template variables (all fields that aren't predefined)
      const predefinedFields = [
        "templateId",
        "recommenderName",
        "recommenderTitle",
        "recommenderInstitution",
        "recommenderEmail",
        "recommenderDepartment",
        "recommenderPhone",
        "relationship",
        "contextOfMeeting",
        "savedRecommenderId",
        "targetInstitution",
        "targetProgram",
        "targetDepartment",
        "targetCountry",
        "purpose",
        "savedInstitutionId",
        "savedVariablesId",
        "studentAchievements",
        "researchExperience",
        "academicPerformance",
        "personalQualities",
        "customContent",
        "finalContent",
      ];

      const templateVariables: Record<string, string> = {};
      Object.keys(wizardData).forEach((key) => {
        if (!predefinedFields.includes(key) && wizardData[key]) {
          templateVariables[key] = wizardData[key] as string;
        }
      });

      const mutationBody = {
        templateId: wizardData.templateId || "",
        title: `${wizardData.targetProgram || ""} - ${wizardData.targetInstitution || ""}`,
        recommenderName: wizardData.recommenderName || "",
        recommenderTitle: wizardData.recommenderTitle || "",
        recommenderInstitution: wizardData.recommenderInstitution || "",
        recommenderEmail: wizardData.recommenderEmail,
        recommenderDepartment: wizardData.recommenderDepartment,
        targetInstitution: wizardData.targetInstitution || "",
        targetProgram: wizardData.targetProgram || "",
        targetDepartment: wizardData.targetDepartment,
        targetCountry: wizardData.targetCountry || "",
        purpose: wizardData.purpose || "",
        relationship: wizardData.relationship || "",
        contextOfMeeting: wizardData.contextOfMeeting,
        studentAchievements: wizardData.studentAchievements,
        researchExperience: wizardData.researchExperience,
        academicPerformance: wizardData.academicPerformance,
        personalQualities: wizardData.personalQualities,
        customContent: wizardData.customContent,
        templateVariables,
      };

      let data: any, error: any;

      if (editMode && letterId) {
        // Update existing letter
        const response = await apiClient.api.recommendations
          .letters({ id: letterId })
          .put(mutationBody);
        data = response.data;
        error = response.error;
      } else {
        // Create new letter
        const response =
          await apiClient.api.recommendations.letters.post(mutationBody);
        data = response.data;
        error = response.error;
      }

      if (error) {
        const errorMessage = editMode
          ? "Failed to update letter"
          : "Failed to create letter";
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: (data) => {
      const successMessage = editMode
        ? "Recommendation letter updated successfully!"
        : "Recommendation letter created successfully!";
      toast.success(successMessage);
      // Redirect to the letter detail page
      if (data?.data?.id) {
        router.push(`/dashboard/recommendations/${data.data.id}`);
      }
    },
    onError: (error) => {
      console.error(
        `Error ${editMode ? "updating" : "creating"} letter:`,
        error,
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${editMode ? "update" : "create"} letter`,
      );
    },
  });

  const handleSubmit = () => {
    letterMutation.mutate();
  };

  const progress =
    ((steps.findIndex((step) => step.id === currentStep) + 1) / steps.length) *
    100;

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        if (editMode) {
          // Skip template selection in edit mode, go directly to recommender info
          return (
            <Step2RecommenderInfo data={wizardData} updateData={updateData} />
          );
        }
        return (
          <Step0TemplateSelection data={wizardData} updateData={updateData} />
        );
      case 2:
        return (
          <Step2RecommenderInfo data={wizardData} updateData={updateData} />
        );
      case 3:
        return <Step3TargetInfo data={wizardData} updateData={updateData} />;
      case 4:
        return (
          <Step4TemplateVariables
            data={wizardData}
            updateData={updateData}
            templateId={wizardData.templateId || ""}
          />
        );
      case 5:
        return <Step6CustomContent data={wizardData} updateData={updateData} />;
      case 6:
        return (
          <Step7ReviewEdit
            data={wizardData}
            updateData={updateData}
            onSubmit={handleSubmit}
            isSubmitting={letterMutation.isPending}
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
        <h1 className="font-bold text-3xl tracking-tight">
          Create Recommendation Letter
        </h1>
        <p className="text-muted-foreground">
          Follow the steps to create your personalized recommendation letter
        </p>
      </div>

      {/* Progress */}
      <Card className="p-1">
        <CardContent className="py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                Step {steps.findIndex((step) => step.id === currentStep) + 1} of{" "}
                {steps.length}
              </span>
              <span className="text-muted-foreground">
                {getCurrentStepObject().title}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-muted-foreground text-xs">
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
          <CardTitle>{getCurrentStepObject().title}</CardTitle>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < Math.max(...steps.map((s) => s.id)) && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === Math.min(...steps.map((s) => s.id))}
          >
            <ChevronLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {currentStep === Math.max(...steps.map((s) => s.id)) - 1
              ? "Review"
              : "Next"}
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}