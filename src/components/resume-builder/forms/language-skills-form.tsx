"use client";

import { useForm } from "@tanstack/react-form";
import { Edit2, Languages, Loader2, Plus, Trash2, X } from "lucide-react";
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
import { apiClient } from "@/lib/eden";

interface LanguageSkill {
  id: string;
  language: string;
  listening: string | null;
  reading: string | null;
  speaking: string | null;
  writing: string | null;
}

interface LanguageSkillsFormProps {
  onSave?: () => void;
  initialData?: LanguageSkill[];
  onDataChange?: () => void;
}

const CEFR_LEVELS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
];

const COMMON_LANGUAGES = [
  "Nepali",
  "English",
  "Hindi",
  "Chinese",
  "German",
  "French",
  "Spanish",
  "Japanese",
  "Korean",
  "Arabic",
  "Other",
];

export function LanguageSkillsForm({
  onSave,
  initialData,
  onDataChange,
}: LanguageSkillsFormProps) {
  const [languageSkills, setLanguageSkills] = useState<LanguageSkill[]>(
    initialData || [],
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      language: "",
      listening: "",
      reading: "",
      speaking: "",
      writing: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          const { data, error } = await apiClient.api["language-skills"]({
            id: editingId,
          }).patch({
            language: value.language,
            listening: value.listening || undefined,
            reading: value.reading || undefined,
            speaking: value.speaking || undefined,
            writing: value.writing || undefined,
          });

          if (error) {
            toast.error("Failed to update language skill.");
          } else if (data?.success) {
            toast.success("Language skill updated successfully!");
            fetchLanguageSkills();
            onDataChange?.();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api["language-skills"].post({
            language: value.language,
            listening: value.listening || undefined,
            reading: value.reading || undefined,
            speaking: value.speaking || undefined,
            writing: value.writing || undefined,
          });

          if (error) {
            toast.error("Failed to add language skill.");
          } else if (data?.success) {
            toast.success("Language skill added successfully!");
            fetchLanguageSkills();
            onDataChange?.();
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

  const fetchLanguageSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api["language-skills"].get();
      if (data?.success) {
        setLanguageSkills(data.data as LanguageSkill[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchLanguageSkills();
    }
  }, [fetchLanguageSkills, initialData]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
  };

  const handleEdit = (skill: LanguageSkill) => {
    setEditingId(skill.id);
    form.setFieldValue("language", skill.language);
    form.setFieldValue("listening", skill.listening ?? "");
    form.setFieldValue("reading", skill.reading ?? "");
    form.setFieldValue("speaking", skill.speaking ?? "");
    form.setFieldValue("writing", skill.writing ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this language skill?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api["language-skills"]({
        id,
      }).delete();

      if (error) {
        toast.error("Failed to delete language skill.");
      } else if (data?.success) {
        toast.success("Language skill deleted successfully!");
        fetchLanguageSkills();
        onDataChange?.();
        if (editingId === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  const getCefrLabel = (level: string | null) => {
    if (!level) return "Not specified";
    const found = CEFR_LEVELS.find((l) => l.value === level);
    return found ? found.label : level;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Language Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CEFR Info */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold">CEFR Levels:</span> The Common
            European Framework of Reference for Languages (CEFR) is an
            international standard for language proficiency. Levels range from
            A1 (beginner) to C2 (proficient).
          </p>
        </div>

        {/* Existing Language Skills */}
        {!isLoading && languageSkills.length > 0 && (
          <div className="space-y-3">
            <Label>Your Language Skills</Label>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">
                      Language
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Listening
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Reading
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Spoken
                    </th>
                    <th className="px-4 py-2 text-left font-semibold">
                      Writing
                    </th>
                    <th className="px-4 py-2 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {languageSkills.map((skill) => (
                    <tr key={skill.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4 text-primary" />
                          <span className="font-medium">{skill.language}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {getCefrLabel(skill.listening)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {getCefrLabel(skill.reading)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {getCefrLabel(skill.speaking)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {getCefrLabel(skill.writing)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                            onClick={() => handleEdit(skill)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                            onClick={() => handleDelete(skill.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>
              {editingId ? "Edit Language Skill" : "Add Language Skill"}
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
            <form.Field name="language">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="language">
                    Language <span className="text-destructive">*</span>
                  </Label>
                  {field.state.value === "Other" ? (
                    <Input
                      id="language"
                      placeholder="Enter language name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      required
                    />
                  ) : (
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                        if (value === "Other") {
                          // Focus on input after selecting "Other"
                          setTimeout(() => {
                            const input = document.getElementById(
                              "language",
                            ) as HTMLInputElement;
                            input?.focus();
                          }, 100);
                        }
                      }}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_LANGUAGES.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <form.Field name="listening">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="listening">Listening</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="listening">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="reading">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="reading">Reading</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="reading">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="speaking">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="speaking">Speaking</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="speaking">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Field name="writing">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="writing">Writing</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="writing">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        {CEFR_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

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
                      "Update Language"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Language
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
                disabled={!canSubmit}
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
