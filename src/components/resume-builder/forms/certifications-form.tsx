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
import { apiClient } from "@/lib/eden";

interface Certification {
  id: string;
  name: string | null;
  issuer: string | null;
  issueDate: string | null;
  credentialUrl: string | null;
}

interface CertificationsFormProps {
  onSave?: () => void;
  initialData?: Certification[];
  onDataChange?: () => void;
}

export function CertificationsForm({
  onSave,
  initialData,
  onDataChange,
}: CertificationsFormProps) {
  const [certifications, setCertifications] = useState<Certification[]>(
    initialData || [],
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [_isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      issuer: "",
      issueDate: "",
      credentialUrl: "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        if (editingId) {
          const { data, error } = await apiClient.api
            .certifications({
              id: editingId,
            })
            .patch({
              name: value.name || undefined,
              issuer: value.issuer || undefined,
              issueDate: value.issueDate || undefined,
              credentialUrl: value.credentialUrl || undefined,
            });

          if (error) {
            toast.error("Failed to update certification.");
          } else if (data?.success) {
            toast.success("Certification updated successfully!");
            fetchCertifications();
            onDataChange?.();
            resetForm();
          }
        } else {
          const { data, error } = await apiClient.api.certifications.post({
            name: value.name || undefined,
            issuer: value.issuer || undefined,
            issueDate: value.issueDate || undefined,
            credentialUrl: value.credentialUrl || undefined,
          });

          if (error) {
            toast.error("Failed to add certification.");
          } else if (data?.success) {
            toast.success("Certification added successfully!");
            fetchCertifications();
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

  const fetchCertifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.api.certifications.get();
      if (data?.success) {
        setCertifications(data.data as Certification[]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchCertifications();
    }
  }, [fetchCertifications, initialData]);

  const resetForm = () => {
    form.reset();
    setEditingId(null);
  };

  const handleEdit = (certification: Certification) => {
    setEditingId(certification.id);
    form.setFieldValue("name", certification.name ?? "");
    form.setFieldValue("issuer", certification.issuer ?? "");
    form.setFieldValue("issueDate", certification.issueDate ?? "");
    form.setFieldValue("credentialUrl", certification.credentialUrl ?? "");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certification?")) {
      return;
    }

    try {
      const { data, error } = await apiClient.api
        .certifications({
          id,
        })
        .delete();

      if (error) {
        toast.error("Failed to delete certification.");
      } else if (data?.success) {
        toast.success("Certification deleted successfully!");
        fetchCertifications();
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Awards & Certifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isLoading && certifications.length > 0 && (
          <div className="space-y-3">
            <Label>Your Certifications</Label>
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex items-start justify-between rounded-lg border bg-muted/30 p-4"
              >
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-semibold">
                      {cert.name || "Award/Certification"}
                    </h4>
                  </div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {cert.issuer && (
                      <Badge variant="outline">{cert.issuer}</Badge>
                    )}
                    {cert.issueDate && (
                      <Badge variant="secondary">
                        {formatDate(cert.issueDate)}
                      </Badge>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-blue-600 text-sm hover:underline"
                    >
                      View Credential
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-blue-500/20 bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white"
                    onClick={() => handleEdit(cert)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white"
                    onClick={() => handleDelete(cert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-4">
          <div className="mb-4 flex items-center justify-between">
            <Label>
              {editingId ? "Edit Certification" : "Add Certification"}
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
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. AWS Certified Solutions Architect"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="issuer">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="issuer">Issuing Organization</Label>
                  <Input
                    id="issuer"
                    placeholder="e.g. Amazon Web Services"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="issueDate">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="month"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="credentialUrl">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="credentialUrl">
                    Credential URL (Optional)
                  </Label>
                  <Input
                    id="credentialUrl"
                    type="url"
                    placeholder="https://example.com/credential"
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
                      "Update Certification"
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Certification
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
                disabled={!canSubmit && certifications.length === 0}
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
