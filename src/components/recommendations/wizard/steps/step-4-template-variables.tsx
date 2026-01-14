"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, FolderOpenIcon, LoaderIcon, SaveIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

interface Step4TemplateVariablesProps {
  data: Record<string, string | undefined>;
  updateData: (field: string, value: string) => void;
  templateId: string;
}

export function Step4TemplateVariables({
  data,
  updateData,
  templateId,
}: Step4TemplateVariablesProps) {
  const queryClient = useQueryClient();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch template
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["recommendation-template", templateId],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations
        .templates({
          id: templateId,
        })
        .get();

      if (error) {
        throw new Error("Failed to fetch template");
      }

      return data?.data;
    },
    enabled: !!templateId,
  });

  // Fetch saved template variables
  const { data: savedVariablesList, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-template-variables", templateId],
    queryFn: async () => {
      const { data } = await apiClient.api.recommendations.saved[
        "template-variables"
      ].get({
        query: { templateId },
      });
      return data?.data || [];
    },
    enabled: !!templateId,
  });

  // Auto-populate template variables from Steps 2 & 3 data
  useEffect(() => {
    if (!template || hasInitialized) return;

    // Mapping from wizard data fields to template variable names
    const fieldMapping: Record<string, string> = {
      // Recommender info from Step 2
      recommenderName: "your_name",
      recommenderTitle: "your_title",
      recommenderInstitution: "your_institution",
      recommenderDepartment: "your_department",
      recommenderEmail: "your_email",
      recommenderPhone: "your_phone",

      // Target info from Step 3
      targetInstitution: "target_institution",
      targetProgram: "target_program",
      targetDepartment: "target_department",
      targetCountry: "target_country",
      purpose: "purpose",

      // Relationship info
      relationship: "relationship",
      contextOfMeeting: "context_of_meeting",
      duration_known: "duration_known",
    };

    // Populate fields from wizard data
    Object.entries(fieldMapping).forEach(([wizardField, templateVar]) => {
      const value = data[wizardField];
      if (value && !data[templateVar]) {
        // Only set if not already set
        updateData(templateVar, value);
      }
    });

    // Set student_name from user data if available
    if (!data.student_name && data.user_name) {
      updateData("student_name", data.user_name);
    }

    setHasInitialized(true);
  }, [template, data, hasInitialized, updateData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.api.recommendations.saved["template-variables"].post({
        templateId,
        name: saveName,
        variables: data,
      });
    },
    onSuccess: () => {
      toast.success("Template variables saved for future use!");
      setShowSaveForm(false);
      setSaveName("");
      queryClient.invalidateQueries({
        queryKey: ["saved-template-variables", templateId],
      });
    },
    onError: () => {
      toast.error("Failed to save template variables");
    },
  });

  // Handle selecting a saved variable set
  const handleSelectSaved = (saved: any) => {
    // Update all fields with saved values
    Object.entries(saved.variables || {}).forEach(([key, value]) => {
      if (typeof value === "string") {
        updateData(key, value);
      }
    });
    updateData("savedVariablesId", saved.id);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    updateData("savedVariablesId", "");
  };

  // Check if form has data
  const hasFormData = Object.keys(data).some(
    (key) => data[key] && data[key]?.trim().length > 0,
  );

  // Find current saved variables
  const currentSavedVariables = savedVariablesList?.find(
    (v) => v.id === data.savedVariablesId,
  );

  if (templateLoading || savedLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return <div>Template not found</div>;
  }

  const variables = template.variables || [];
  const groupedVariables = variables.reduce(
    (acc, variable) => {
      // Group by category based on variable name patterns
      let category = "general";

      if (
        variable.name.includes("your_") ||
        variable.name.includes("recommender")
      ) {
        category = "recommender";
      } else if (
        variable.name.includes("target_") ||
        variable.name.includes("purpose")
      ) {
        category = "target";
      } else if (
        variable.name.includes("student_") ||
        variable.name.includes("research") ||
        variable.name.includes("course") ||
        variable.name.includes("academic")
      ) {
        category = "student";
      } else if (variable.name.includes("user")) {
        category = "user";
      }

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(variable);
      return acc;
    },
    {} as Record<string, typeof variables>,
  );

  const categoryOrder = ["user", "recommender", "target", "student", "general"];
  const categoryTitles: Record<string, string> = {
    user: "Your Information",
    recommender: "Recommender Information",
    target: "Target Institution",
    student: "Student Details",
    general: "Additional Information",
  };

  const renderField = (variable: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    description?: string;
    options?: string[];
  }) => {
    const value = data[variable.name] || variable.defaultValue || "";
    const fieldId = `var-${variable.name}`;

    const handleChange = (newValue: string) => {
      updateData(variable.name, newValue);
      handleClearSelection();
    };

    return (
      <div key={variable.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId}>
            {variable.label}
            {variable.required && (
              <span className="ml-1 text-destructive">*</span>
            )}
            {!variable.required && (
              <span className="ml-1 text-muted-foreground text-xs">
                (optional)
              </span>
            )}
          </Label>
          {variable.required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>

        {variable.description && (
          <p className="text-muted-foreground text-sm">
            {variable.description}
          </p>
        )}

        {variable.type === "textarea" ? (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={variable.defaultValue}
            required={variable.required}
            rows={3}
            className="resize-none"
          />
        ) : variable.type === "select" ? (
          <Select
            value={value}
            onValueChange={(newValue) => handleChange(newValue)}
            required={variable.required}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue
                placeholder={`Select ${variable.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {variable.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={variable.defaultValue}
            required={variable.required}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Saved Variables Selection */}
      {!savedLoading && savedVariablesList && savedVariablesList.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpenIcon className="h-4 w-4" />
              Saved Variable Sets
              {currentSavedVariables && (
                <Badge variant="default" className="ml-2">
                  <CheckIcon className="mr-1 h-3 w-3" />
                  Selected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedVariablesList.map((saved) => (
              <div
                key={saved.id}
                role="button"
                tabIndex={0}
                className="flex cursor-pointer items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50"
                onClick={() => handleSelectSaved(saved)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectSaved(saved);
                  }
                }}
              >
                <div className="flex-1">
                  <p className="font-medium">{saved.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {Object.keys(saved.variables || {}).length} variables saved
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSaved(saved);
                  }}
                >
                  Use
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Template Variables Form */}
      <div>
        <h3 className="font-medium text-lg">Template Details</h3>
        <p className="text-muted-foreground text-sm">
          Fill in the variables for the "{template.name}" template
        </p>
      </div>

      {categoryOrder
        .filter((category) => groupedVariables[category])
        .map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base">
                {categoryTitles[category]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedVariables[category].map(renderField)}
            </CardContent>
          </Card>
        ))}

      {/* Save for future reference */}
      {hasFormData && !showSaveForm && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowSaveForm(true)}
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Save for future reference
        </Button>
      )}

      {showSaveForm && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="saveName">
              Save as <span className="text-destructive">*</span>
            </Label>
            <Input
              id="saveName"
              placeholder="e.g., Stanford PhD Application - Research Focus"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Give this variable set a name for easy identification
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={!saveName || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowSaveForm(false);
                setSaveName("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
