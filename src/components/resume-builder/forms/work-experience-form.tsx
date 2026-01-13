"use client";

import { useForm } from "@tanstack/react-form";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

interface WorkExperience {
  id: string;
  jobTitle: string | null;
  employer: string | null;
  startDate: string | null;
  endDate: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
}

interface WorkExperienceFormProps {
  onSave?: () => void;
}

const COUNTRIES = [
  "Nepal",
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "Other",
];

export function WorkExperienceForm({ onSave }: WorkExperienceFormProps) {
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);

  const form = useForm({
    defaultValues: {
      jobTitle: "",
      employer: "",
      startDate: "",
      endDate: "",
      city: "",
      country: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          // Update existing experience
          const { data, error } = await apiClient.api[
            "work-experiences"
          ]({ id: editingId }).patch({
            jobTitle: value.jobTitle || undefined,
            employer: value.employer || undefined,
            startDate: value.startDate || undefined,
            endDate: isCurrent ? undefined : (value.endDate || undefined),
            city: value.city || undefined,
            country: value.country || undefined,
            description: value.description || undefined,
          });

          if (error) {
            toast.error("Failed to update work experience.");
          } else if (data?.success) {
            toast.success("Work experience updated successfully!");
            fetchExperiences();
            resetForm();
          }
        } else {
          // Create new experience
          const { data, error } = await apiClient.api["work-experiences"].post({
            jobTitle: value.jobTitle || undefined,
            employer: value.employer || undefined,
            startDate: value.startDate || undefined,
            endDate: isCurrent ? undefined : (value.endDate || undefined),
            city: value.city || undefined,
            country: value.country || undefined,
            description: value.description || undefined,
          });

          if (error) {
            toast.error("Failed to add work experience.");
          } else if (data?.success) {
            toast.success("Work experience added successfully!");
            fetchExperiences();
            resetForm();
          }
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchExperiences = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api["work-experiences"].get();
      if (data?.success) {
        setExperiences(data.data as WorkExperience[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
    setIsCurrent(false);
  };

  const handleEdit = (experience: WorkExperience) => {
    setEditingId(experience.id);
    form.setFieldValue("jobTitle", experience.jobTitle ?? "");
    form.setFieldValue("employer", experience.employer ?? "");
    form.setFieldValue("startDate", experience.startDate ?? "");
    form.setFieldValue("endDate", experience.endDate ?? "");
    form.setFieldValue("city", experience.city ?? "");
    form.setFieldValue("country", experience.country ?? "");
    form.setFieldValue("description", experience.description ?? "");
    setIsCurrent(!experience.endDate);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this work experience?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api["work-experiences"]({
        id,
      }).delete();

      if (error) {
        toast.error("Failed to delete work experience.");
      } else if (data?.success) {
        toast.success("Work experience deleted successfully!");
        fetchExperiences();
        if (editingId === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Experience</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Experiences List */}
        {!isLoading && experiences.length > 0 && (
          <div className="space-y-3">
            <Label>Your Work Experience</Label>
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-semibold">{exp.jobTitle || "Position"}</h4>
                    {exp.employer && (
                      <>
                        <span className="text-muted-foreground">@</span>
                        <span className="font-medium text-sm">
                          {exp.employer}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </Badge>
                    {(exp.city || exp.country) && (
                      <Badge variant="secondary">
                        {[exp.city, exp.country].filter(Boolean).join(", ")}
                      </Badge>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-muted-foreground text-sm">
                      {exp.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(exp)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(exp.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>
              {editingId ? "Edit Work Experience" : "Add Work Experience"}
            </Label>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Edit
              </Button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="jobTitle">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">
                      Job Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="jobTitle"
                      placeholder="Software Engineer"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="employer">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="employer">
                      Employer <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="employer"
                      placeholder="Company Name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="startDate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Start Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="month"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  </div>
                )}
              </form.Field>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isCurrent"
                    checked={isCurrent}
                    onCheckedChange={(checked) =>
                      setIsCurrent(checked as boolean)
                    }
                  />
                  <Label htmlFor="isCurrent" className="cursor-pointer">
                    I currently work here
                  </Label>
                </div>

                {!isCurrent && (
                  <form.Field name="endDate">
                    {(field) => (
                      <Input
                        placeholder="End Date"
                        type="month"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                    )}
                  </form.Field>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="city">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Kathmandu"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="country">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="country">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="description">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your responsibilities, achievements, and skills used..."
                    className="min-h-32 resize-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <p className="text-muted-foreground text-xs">
                    Focus on achievements and quantifiable results when possible
                  </p>
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.isSubmitting]}>
              {([isSubmitting]) => (
                <div className="flex justify-end gap-2">
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Experience"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Experience
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </div>

        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onSave}
                disabled={!canSubmit || experiences.length === 0}
              >
                Save & Continue
              </Button>
            </div>
          )}
        </form.Subscribe>
      </CardContent>
    </Card>
  );
}
