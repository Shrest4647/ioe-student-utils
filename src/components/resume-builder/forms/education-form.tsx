"use client";

import { useForm } from "@tanstack/react-form";
import { Edit2, GraduationCap, Loader2, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

interface EducationRecord {
  id: string;
  institution: string | null;
  qualification: string | null;
  degreeLevel: string | null;
  startDate: string | null;
  endDate: string | null;
  grade: string | null;
  gradeType: string | null;
  description: string | null;
}

interface EducationFormProps {
  onSave?: () => void;
}

const DEGREE_LEVELS = [
  "High School",
  "Certificate",
  "Diploma",
  "Bachelor",
  "Master",
  "PhD",
  "Post Doctorate",
  "Other",
];

export function EducationForm({ onSave }: EducationFormProps) {
  const [educations, setEducations] = useState<EducationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      institution: "",
      qualification: "",
      degreeLevel: "",
      startDate: "",
      endDate: "",
      grade: "",
      gradeType: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          const { data, error } = await apiClient.api.education({
            id: editingId,
          }).patch({
            institution: value.institution || undefined,
            qualification: value.qualification || undefined,
            degreeLevel: value.degreeLevel || undefined,
            startDate: value.startDate || undefined,
            endDate: value.endDate || undefined,
            grade: value.grade || undefined,
            gradeType: value.gradeType || undefined,
            description: value.description || undefined,
          });

          if (error) {
            toast.error("Failed to update education record.");
          } else if (data?.success) {
            toast.success("Education record updated successfully!");
            fetchEducations();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api.education.post({
            institution: value.institution || undefined,
            qualification: value.qualification || undefined,
            degreeLevel: value.degreeLevel || undefined,
            startDate: value.startDate || undefined,
            endDate: value.endDate || undefined,
            grade: value.grade || undefined,
            gradeType: value.gradeType || undefined,
            description: value.description || undefined,
          });

          if (error) {
            toast.error("Failed to add education record.");
          } else if (data?.success) {
            toast.success("Education record added successfully!");
            fetchEducations();
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

  const fetchEducations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.education.get();
      if (data?.success) {
        setEducations(data.data as EducationRecord[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEducations();
  }, [fetchEducations]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
  };

  const handleEdit = (education: EducationRecord) => {
    setEditingId(education.id);
    form.setFieldValue("institution", education.institution ?? "");
    form.setFieldValue("qualification", education.qualification ?? "");
    form.setFieldValue("degreeLevel", education.degreeLevel ?? "");
    form.setFieldValue("startDate", education.startDate ?? "");
    form.setFieldValue("endDate", education.endDate ?? "");
    form.setFieldValue("grade", education.grade ?? "");
    form.setFieldValue("gradeType", education.gradeType ?? "");
    form.setFieldValue("description", education.description ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this education record?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api.education({ id }).delete();

      if (error) {
        toast.error("Failed to delete education record.");
      } else if (data?.success) {
        toast.success("Education record deleted successfully!");
        fetchEducations();
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
        <CardTitle>Education & Training</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Education Records */}
        {!isLoading && educations.length > 0 && (
          <div className="space-y-3">
            <Label>Your Education</Label>
            {educations.map((edu) => (
              <div
                key={edu.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">
                      {edu.qualification || "Qualification"}
                    </h4>
                    {edu.degreeLevel && (
                      <Badge variant="outline">{edu.degreeLevel}</Badge>
                    )}
                  </div>
                  {edu.institution && (
                    <p className="mb-2 font-medium text-sm">{edu.institution}</p>
                  )}
                  <div className="mb-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </Badge>
                    {edu.grade && (
                      <Badge variant="outline">Grade: {edu.grade}</Badge>
                    )}
                    {edu.gradeType && (
                      <Badge variant="outline">{edu.gradeType}</Badge>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-muted-foreground text-sm">
                      {edu.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(edu)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(edu.id)}
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
              {editingId ? "Edit Education" : "Add Education"}
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
            <form.Field name="institution">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="institution">
                    Institution <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="institution"
                    placeholder="Tribhuvan University, IOE Pulchowk Campus"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <form.Field name="qualification">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="qualification">
                      Qualification <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="qualification"
                      placeholder="Bachelor of Technology"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="degreeLevel">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="degreeLevel">Degree Level</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="degreeLevel">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

              <form.Field name="endDate">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="month"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <p className="text-muted-foreground text-xs">
                      Leave empty if currently studying
                    </p>
                  </div>
                )}
              </form.Field>

              <form.Field name="grade">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade/Score</Label>
                    <Input
                      id="grade"
                      placeholder="First Class / 3.8 GPA"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="gradeType">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="gradeType">Grade Type</Label>
                    <Input
                      id="gradeType"
                      placeholder="GPA-4, Percentage, etc."
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
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
                    placeholder="Thesis title, key achievements, relevant coursework, etc..."
                    className="min-h-24 resize-none"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
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
                      "Update Education"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Education
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
                disabled={!canSubmit || educations.length === 0}
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
