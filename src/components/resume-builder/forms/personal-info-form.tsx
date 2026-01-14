"use client";

import { useForm } from "@tanstack/react-form";
import { FileImage, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

interface PersonalInfoFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    nationality?: string;
    dateOfBirth?: string;
    photoUrl?: string;
    summary?: string;
    linkedIn?: string;
    github?: string;
    web?: string;
  };
  onSave?: () => void;
  onDataChange?: () => void;
}

export function PersonalInfoForm({
  initialData,
  onSave,
  onDataChange,
}: PersonalInfoFormProps) {
  const [_isSubmitting, setIsSubmitting] = useState(false);

  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl ?? "");
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm({
    defaultValues: {
      firstName: initialData?.firstName ?? "",
      lastName: initialData?.lastName ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      street: initialData?.address?.street ?? "",
      city: initialData?.address?.city ?? "",
      state: initialData?.address?.state ?? "",
      postalCode: initialData?.address?.postalCode ?? "",
      country: initialData?.address?.country ?? "Nepal",
      nationality: initialData?.nationality ?? "Nepali",
      dateOfBirth: initialData?.dateOfBirth ?? "",
      summary: initialData?.summary ?? "",
      linkedIn: initialData?.linkedIn ?? "",
      github: initialData?.github ?? "",
      web: initialData?.web ?? "",
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const payload = {
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email || undefined,
          phone: value.phone || undefined,
          address: {
            street: value.street || undefined,
            city: value.city || undefined,
            state: value.state || undefined,
            postalCode: value.postalCode || undefined,
            country: value.country || undefined,
          },
          nationality: value.nationality || undefined,
          dateOfBirth: value.dateOfBirth || undefined,
          photoUrl: photoUrl || undefined,
          summary: value.summary || undefined,
          linkedIn: value.linkedIn || undefined,
          github: value.github || undefined,
          web: value.web || undefined,
        };

        const { data, error } = await (initialData
          ? apiClient.api.profiles.patch(payload)
          : apiClient.api.profiles.post(payload));

        if (error) {
          toast.error("Failed to save profile information.");
        } else if (data?.success) {
          toast.success("Profile information saved successfully!");
          onSave?.();
          onDataChange?.();
        }
      } catch (err) {
        console.error("Submission Error:", err);
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be less than 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      // Get presigned URL
      const { data: presignedData } = await apiClient.api.resources[
        "presigned-upload"
      ].post({
        fileName: `profile-photo-${Date.now()}${file.name.substring(file.name.lastIndexOf("."))}`,
        contentType: file.type,
      });

      if (!presignedData?.success) {
        throw new Error("Failed to get upload URL");
      }

      const { url: uploadUrl } = presignedData.data;

      // Upload file to S3
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to upload photo: ${errorText || response.statusText}`,
        );
      }

      // Remove query params from URL
      const finalUrl = uploadUrl.split("?")[0];
      setPhotoUrl(finalUrl);
      toast.success("Photo uploaded successfully!");
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error("Failed to upload photo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Photo Upload */}
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-border bg-muted">
              {photoUrl ? (
                <Image
                  height={200}
                  width={200}
                  src={photoUrl}
                  alt="Profile photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <FileImage className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="photo">Profile Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
                className="max-w-xs"
              />
              <p className="text-muted-foreground text-xs">
                Upload a professional photo (max 5MB). This is optional.
              </p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="firstName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="lastName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+977 9800000000"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Address Fields */}
          <div className="space-y-4">
            <Label>Address (Optional)</Label>
            <form.Field name="street">
              {(field) => (
                <div className="space-y-2">
                  <Input
                    placeholder="Street Address"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <form.Field name="city">
                {(field) => (
                  <Input
                    placeholder="City"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>

              <form.Field name="state">
                {(field) => (
                  <Input
                    placeholder="State/Province"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>

              <form.Field name="postalCode">
                {(field) => (
                  <Input
                    placeholder="Postal Code"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="country">
              {(field) => (
                <Input
                  placeholder="Country"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              )}
            </form.Field>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <form.Field name="nationality">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Nepali"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="dateOfBirth">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="month"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  <p className="text-muted-foreground text-xs">
                    Used for age verification purposes only
                  </p>
                </div>
              )}
            </form.Field>
          </div>

          {/* Professional Summary */}
          <form.Field name="summary">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Briefly describe your professional background, goals, and key achievements..."
                  className="min-h-32 resize-none"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                <p className="text-muted-foreground text-xs">
                  A 2-3 sentence summary that highlights your key qualifications
                </p>
              </div>
            )}
          </form.Field>

          {/* Social/Online Presence */}
          <div className="space-y-4">
            <Label>Online Presence (Optional)</Label>
            <form.Field name="linkedIn">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="linkedIn" className="text-xs">
                    LinkedIn Profile
                  </Label>
                  <Input
                    id="linkedIn"
                    type="url"
                    placeholder="https://linkedin.com/in/johndoe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="github">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="github" className="text-xs">
                    GitHub Profile
                  </Label>
                  <Input
                    id="github"
                    type="url"
                    placeholder="https://github.com/johndoe"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="web">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="web" className="text-xs">
                    Personal Website
                  </Label>
                  <Input
                    id="web"
                    type="url"
                    placeholder="https://johndoe.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(state) => [state.isSubmitting]}>
            {([isSubmitting]) => (
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save & Continue"
                  )}
                </Button>
              </div>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
