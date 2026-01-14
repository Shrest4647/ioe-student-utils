"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, LoaderIcon, SaveIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

interface Step2RecommenderInfoProps {
  data: {
    recommenderName?: string;
    recommenderTitle?: string;
    recommenderInstitution?: string;
    recommenderEmail?: string;
    recommenderDepartment?: string;
    recommenderPhone?: string;
    relationship?: string;
    contextOfMeeting?: string;
    savedRecommenderId?: string;
  };
  updateData: (field: string, value: string) => void;
}

export function Step2RecommenderInfo({
  data,
  updateData,
}: Step2RecommenderInfoProps) {
  const queryClient = useQueryClient();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Fetch saved recommenders
  const { data: savedRecommenders, isLoading } = useQuery({
    queryKey: ["saved-recommenders"],
    queryFn: async () => {
      const { data } =
        await apiClient.api.recommendations.saved.recommenders.get();
      return data?.data || [];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.api.recommendations.saved.recommenders.post({
        name: saveName,
        title: data.recommenderTitle || "",
        institution: data.recommenderInstitution || "",
        department: data.recommenderDepartment,
        email: data.recommenderEmail,
        phone: data.recommenderPhone,
        relationship: data.relationship,
        contextOfMeeting: data.contextOfMeeting,
      });
    },
    onSuccess: () => {
      toast.success("Recommender saved for future use!");
      setShowSaveForm(false);
      setSaveName("");
      queryClient.invalidateQueries({ queryKey: ["saved-recommenders"] });
    },
    onError: () => {
      toast.error("Failed to save recommender");
    },
  });

  // Handle selecting a saved recommender
  const handleSelectSaved = (recommender: any) => {
    updateData("recommenderName", recommender.name);
    updateData("recommenderTitle", recommender.title);
    updateData("recommenderInstitution", recommender.institution);
    updateData("recommenderDepartment", recommender.department || "");
    updateData("recommenderEmail", recommender.email || "");
    updateData("recommenderPhone", recommender.phone || "");
    updateData("relationship", recommender.relationship || "");
    updateData("contextOfMeeting", recommender.contextOfMeeting || "");
    updateData("savedRecommenderId", recommender.id);
  };

  // Handle clearing selection
  const handleClearSelection = () => {
    updateData("savedRecommenderId", "");
  };

  // Check if form has data
  const hasFormData =
    data.recommenderName ||
    data.recommenderTitle ||
    data.recommenderInstitution;

  // Find current saved recommender
  const currentSavedRecommender = savedRecommenders?.find(
    (r) => r.id === data.savedRecommenderId,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Recommender Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommenderName">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recommenderName"
                placeholder="Dr. John Smith"
                value={data.recommenderName || ""}
                onChange={(e) => {
                  updateData("recommenderName", e.target.value);
                  handleClearSelection();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommenderTitle">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recommenderTitle"
                placeholder="Professor of Computer Science"
                value={data.recommenderTitle || ""}
                onChange={(e) => updateData("recommenderTitle", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommenderInstitution">
                Institution <span className="text-destructive">*</span>
              </Label>
              <Input
                id="recommenderInstitution"
                placeholder="Institute of Engineering, Tribhuvan University"
                value={data.recommenderInstitution || ""}
                onChange={(e) =>
                  updateData("recommenderInstitution", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommenderDepartment">Department</Label>
              <Input
                id="recommenderDepartment"
                placeholder="Department of Computer Engineering"
                value={data.recommenderDepartment || ""}
                onChange={(e) =>
                  updateData("recommenderDepartment", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommenderEmail">Email (optional)</Label>
              <Input
                id="recommenderEmail"
                type="email"
                placeholder="john.smith@ioe.edu.np"
                value={data.recommenderEmail || ""}
                onChange={(e) => updateData("recommenderEmail", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommenderPhone">Phone (optional)</Label>
              <Input
                id="recommenderPhone"
                type="tel"
                placeholder="+977 1-1234567"
                value={data.recommenderPhone || ""}
                onChange={(e) => updateData("recommenderPhone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">
                How do you know them?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="relationship"
                placeholder="e.g., Thesis Advisor, Course Instructor, Research Supervisor"
                value={data.relationship || ""}
                onChange={(e) => updateData("relationship", e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Describe your relationship with the recommender
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextOfMeeting">
                Context of meeting (optional)
              </Label>
              <Textarea
                id="contextOfMeeting"
                placeholder="e.g., Supervised my senior year project, taught 3 courses including Data Structures and Algorithms"
                value={data.contextOfMeeting || ""}
                onChange={(e) => updateData("contextOfMeeting", e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-muted-foreground text-xs">
                Provide more context about how you know the recommender
              </p>
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
                    placeholder="e.g., Thesis Advisor - Dr. Smith"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    Give this recommender a name for easy identification
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
                Saved Recommenders
                {currentSavedRecommender && (
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
              ) : !savedRecommenders || savedRecommenders.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No saved recommenders yet. Fill out the form and save for
                  future use.
                </p>
              ) : (
                savedRecommenders.map((recommender) => (
                  <div
                    key={recommender.id}
                    role="button"
                    tabIndex={0}
                    className={`flex cursor-pointer items-start justify-between rounded-lg border p-3 transition-colors ${
                      currentSavedRecommender?.id === recommender.id
                        ? "border-primary bg-primary/10"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleSelectSaved(recommender)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectSaved(recommender);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{recommender.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {recommender.title}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {recommender.institution}
                      </p>
                      {recommender.relationship && (
                        <p className="mt-1 text-muted-foreground text-xs">
                          Relationship: {recommender.relationship}
                        </p>
                      )}
                    </div>
                    {currentSavedRecommender?.id === recommender.id && (
                      <CheckIcon className="ml-2 h-4 w-4 flex-shrink-0 text-primary" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="text-muted-foreground text-xs">
            <p className="mb-1 font-medium">Quick Tip:</p>
            Click on any saved recommender to auto-fill the form with their
            details.
          </div>
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Enter the details of the person who will be recommending you. This
        information will be used in the letter header and signature.
      </p>
    </div>
  );
}
