"use client";

import { useForm } from "@tanstack/react-form";
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
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

interface SkillRecord {
  id: string;
  category: string;
  skills: Array<{ name: string; proficiency?: string }>;
}

interface SkillsFormProps {
  onSave?: () => void;
}

const SKILL_CATEGORIES = [
  { value: "programming-languages", label: "Programming Languages" },
  { value: "frameworks", label: "Frameworks & Libraries" },
  { value: "databases", label: "Databases" },
  { value: "tools", label: "Tools & Software" },
  { value: "cloud-platforms", label: "Cloud Platforms" },
  { value: "communication", label: "Communication Skills" },
  { value: "leadership", label: "Leadership & Management" },
  { value: "problem-solving", label: "Problem Solving" },
  { value: "design", label: "Design Skills" },
  { value: "languages", label: "Natural Languages" },
  { value: "other", label: "Other Skills" },
];

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export function SkillsForm({ onSave }: SkillsFormProps) {
  const [userSkills, setUserSkills] = useState<SkillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [skillItems, setSkillItems] = useState<
    Array<{ name: string; proficiency?: string }>
  >([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] =
    useState("intermediate");

  const form = useForm({
    defaultValues: {
      category: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      if (skillItems.length === 0) {
        toast.error("Please add at least one skill.");
        return;
      }

      setIsSubmitting(true);
      try {
        const skillsData = {
          category: value.category,
          skills: skillItems,
        };

        if (editingId) {
          const { data, error } = await apiClient.api
            .skills({
              id: editingId,
            })
            .patch(skillsData as any);

          if (error) {
            toast.error("Failed to update skills.");
          } else if (data?.success) {
            toast.success("Skills updated successfully!");
            fetchUserSkills();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api.skills.post(
            skillsData as any,
          );

          if (error) {
            toast.error("Failed to add skills.");
          } else if (data?.success) {
            toast.success("Skills added successfully!");
            fetchUserSkills();
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

  const fetchUserSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.skills.get();
      if (data?.success) {
        setUserSkills(data.data as SkillRecord[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSkills();
  }, [fetchUserSkills]);

  const resetForm = () => {
    form.reset();
    setSkillItems([]);
    setNewSkillName("");
    setNewSkillProficiency("intermediate");
    setEditingId(null);
  };

  const handleEdit = (skill: SkillRecord) => {
    setEditingId(skill.id);
    form.setFieldValue("category", skill.category);
    setSkillItems(skill.skills);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete these skills?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api.skills({ id }).delete();

      if (error) {
        toast.error("Failed to delete skills.");
      } else if (data?.success) {
        toast.success("Skills deleted successfully!");
        fetchUserSkills();
        if (editingId === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error("An unexpected error occurred.");
    }
  };

  const addSkillItem = () => {
    if (!newSkillName.trim()) {
      toast.error("Please enter a skill name.");
      return;
    }

    if (
      skillItems.some(
        (s) => s.name.toLowerCase() === newSkillName.toLowerCase(),
      )
    ) {
      toast.error("This skill already exists in the list.");
      return;
    }

    setSkillItems([
      ...skillItems,
      { name: newSkillName.trim(), proficiency: newSkillProficiency },
    ]);
    setNewSkillName("");
    setNewSkillProficiency("intermediate");
  };

  const removeSkillItem = (index: number) => {
    setSkillItems(skillItems.filter((_, i) => i !== index));
  };

  const getCategoryLabel = (category: string) => {
    const found = SKILL_CATEGORIES.find((c) => c.value === category);
    return found ? found.label : category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Skills */}
        {!isLoading && userSkills.length > 0 && (
          <div className="space-y-3">
            <Label>Your Skills</Label>
            {userSkills.map((skillRecord) => (
              <div
                key={skillRecord.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold">
                    {getCategoryLabel(skillRecord.category)}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {skillRecord.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-sm">
                        {skill.name}
                        {skill.proficiency && (
                          <span className="ml-1 opacity-70">
                            ({skill.proficiency})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(skillRecord)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(skillRecord.id)}
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
            <Label>{editingId ? "Edit Skills" : "Add Skills"}</Label>
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
            <form.Field name="category">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={!!editingId}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            {/* Skills List */}
            <div className="space-y-2">
              <Label>
                Skills <span className="text-destructive">*</span>
              </Label>
              <div className="rounded-lg border p-3">
                {skillItems.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm">
                    No skills added yet. Add skills below.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skillItems.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="group relative pr-8 text-sm"
                      >
                        {skill.name}
                        {skill.proficiency && (
                          <span className="ml-1 opacity-70">
                            ({skill.proficiency})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeSkillItem(index)}
                          className="absolute top-0 -right-1 ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Skill */}
            <div className="flex gap-2">
              <Input
                placeholder="Skill name (e.g., Python, React)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkillItem();
                  }
                }}
                className="flex-1"
              />
              <Select
                value={newSkillProficiency}
                onValueChange={setNewSkillProficiency}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Proficiency" />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={addSkillItem}
                disabled={!newSkillName.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
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
                  <Button
                    type="submit"
                    disabled={isSubmitting || skillItems.length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : editingId ? (
                      "Update Skills"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Skills
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
                disabled={!canSubmit || userSkills.length === 0}
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
