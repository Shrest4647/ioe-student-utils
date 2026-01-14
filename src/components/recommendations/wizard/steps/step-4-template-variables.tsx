"use client";

import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderIcon } from "lucide-react";
import { apiClient } from "@/lib/eden";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const { data: template, isLoading } = useQuery({
    queryKey: ["recommendation-template", templateId],
    queryFn: async () => {
      const { data, error } = await apiClient.api.recommendations.templates({
        id: templateId,
      }).get();

      if (error) {
        throw new Error("Failed to fetch template");
      }

      return data?.data;
    },
    enabled: !!templateId,
  });

  if (isLoading) {
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
  const groupedVariables = variables.reduce((acc, variable) => {
    // Group by category based on variable name patterns
    let category = "general";

    if (variable.name.includes("your_") || variable.name.includes("recommender")) {
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
  }, {} as Record<string, typeof variables>);

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
    };

    return (
      <div key={variable.name} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldId}>
            {variable.label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {variable.required && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
        </div>

        {variable.description && (
          <p className="text-muted-foreground text-sm">{variable.description}</p>
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
              <SelectValue placeholder={`Select ${variable.label.toLowerCase()}`} />
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
      <div>
        <h3 className="text-lg font-medium">Template Details</h3>
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
    </div>
  );
}
