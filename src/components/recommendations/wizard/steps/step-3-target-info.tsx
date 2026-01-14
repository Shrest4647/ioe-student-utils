"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  GraduationCapIcon,
  LoaderIcon,
  SaveIcon,
} from "lucide-react";
import { useState } from "react";
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
import { apiClient } from "@/lib/eden";

interface Step3TargetInfoProps {
  data: {
    targetInstitution?: string;
    targetProgram?: string;
    targetDepartment?: string;
    targetCountry?: string;
    purpose?: string;
    savedInstitutionId?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step3TargetInfo({ data, updateData }: Step3TargetInfoProps) {
  const queryClient = useQueryClient();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Fetch saved institutions
  const { data: savedInstitutions, isLoading } = useQuery({
    queryKey: ["saved-institutions"],
    queryFn: async () => {
      const { data } =
        await apiClient.api.recommendations.saved.institutions.get();
      return data?.data || [];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.api.recommendations.saved.institutions.post({
        institution: data.targetInstitution || "",
        program: data.targetProgram,
        department: data.targetDepartment,
        country: data.targetCountry || "",
        purpose: data.purpose,
      });
    },
    onSuccess: () => {
      toast.success("Institution saved for future use!");
      setShowSaveForm(false);
      setSaveName("");
      queryClient.invalidateQueries({ queryKey: ["saved-institutions"] });
    },
    onError: () => {
      toast.error("Failed to save institution");
    },
  });

  // Handle selecting a saved institution
  const handleSelectSaved = (institution: any) => {
    updateData("targetInstitution", institution.institution);
    updateData("targetProgram", institution.program || "");
    updateData("targetDepartment", institution.department || "");
    updateData("targetCountry", institution.country);
    updateData("purpose", institution.purpose || "");
    updateData("savedInstitutionId", institution.id);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    updateData("savedInstitutionId", "");
  };

  // Check if form has data
  const hasFormData =
    data.targetInstitution || data.targetProgram || data.targetCountry;

  // Find current saved institution
  const currentSavedInstitution = savedInstitutions?.find(
    (i) => i.id === data.savedInstitutionId,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCapIcon className="h-5 w-5" />
              Target Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetInstitution">
                Target Institution <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetInstitution"
                placeholder="Stanford University"
                value={data.targetInstitution || ""}
                onChange={(e) => {
                  updateData("targetInstitution", e.target.value);
                  handleClearSelection();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetProgram">
                Target Program <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetProgram"
                placeholder="PhD in Computer Science"
                value={data.targetProgram || ""}
                onChange={(e) => updateData("targetProgram", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDepartment">Department</Label>
              <Input
                id="targetDepartment"
                placeholder="Department of Computer Science"
                value={data.targetDepartment || ""}
                onChange={(e) => updateData("targetDepartment", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCountry">
                Country <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.targetCountry || ""}
                onValueChange={(value) => updateData("targetCountry", value)}
              >
                <SelectTrigger id="targetCountry">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Japan">Japan</SelectItem>
                  <SelectItem value="Nepal">Nepal</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">
                Purpose <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.purpose || ""}
                onValueChange={(value) => updateData("purpose", value)}
              >
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="job">Job Application</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                    placeholder="e.g., Stanford PhD - Computer Science"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Give this institution a name for easy identification
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
          </CardContent>
        </Card>

        {/* Right Column - Saved List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Saved Institutions
                {currentSavedInstitution && (
                  <Badge variant="default" className="ml-2">
                    <CheckIcon className="mr-1 h-3 w-3" />
                    Selected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !savedInstitutions || savedInstitutions.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No saved institutions yet. Fill out the form and save for
                  future use.
                </p>
              ) : (
                savedInstitutions.map((institution) => (
                  <div
                    key={institution.id}
                    role="button"
                    tabIndex={0}
                    className={`flex cursor-pointer items-start justify-between rounded-lg border p-3 transition-colors ${
                      currentSavedInstitution?.id === institution.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleSelectSaved(institution)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectSaved(institution);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {institution.institution}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {institution.program || "No program"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {institution.country} • {institution.purpose || "N/A"}
                      </p>
                    </div>
                    {currentSavedInstitution?.id === institution.id && (
                      <CheckIcon className="ml-2 h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="text-muted-foreground text-xs">
            <p className="mb-1 font-medium">Quick Tip:</p>
            Click on any saved institution to auto-fill the form with their
            details.
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Enter the details of where you are applying. This information will be
        used in the letter body.
      </p>
    </div>
  );
}
