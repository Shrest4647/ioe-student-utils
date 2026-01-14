"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange?: (stepIndex: number) => void;
  completedSteps?: Set<number>;
}

export function Stepper({
  steps,
  currentStep,
  onStepChange,
  completedSteps = new Set(),
}: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const isClickable =
            onStepChange && (isCompleted || index < currentStep);

          return (
            <div key={step.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepChange(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-1 flex-col items-start gap-1 transition-colors",
                  isClickable && "cursor-pointer hover:opacity-80",
                  !isClickable && "cursor-default",
                )}
              >
                <div className="flex w-full items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                      isCurrent &&
                        "border-primary bg-primary text-primary-foreground",
                      isCompleted &&
                        "border-primary bg-primary text-primary-foreground",
                      !isCurrent &&
                        !isCompleted &&
                        "border-muted-foreground/50",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1 transition-colors",
                        index < currentStep ? "bg-primary" : "bg-muted",
                      )}
                    />
                  )}
                </div>

                <div className="ml-1 flex flex-col items-start">
                  <span
                    className={cn(
                      "font-medium text-sm",
                      (isCurrent || isCompleted) && "text-foreground",
                      !isCurrent && !isCompleted && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="text-muted-foreground text-xs">
                      {step.description}
                    </span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepperNavProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  previousLabel?: string;
}

export function StepperNav({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canGoNext = true,
  canGoPrevious = true,
  isSubmitting = false,
  nextLabel,
  previousLabel = "Previous",
}: StepperNavProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || !canGoPrevious || isSubmitting}
      >
        {previousLabel}
      </Button>

      <div className="text-muted-foreground text-sm">
        Step {currentStep + 1} of {totalSteps}
      </div>

      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
      >
        {isSubmitting
          ? "Saving..."
          : isLastStep
            ? nextLabel || "Complete"
            : "Next"}
      </Button>
    </div>
  );
}
