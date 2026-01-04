"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2, Save, User } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileSchema } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/eden";

interface ProfileSectionProps {
  user: { name: string; email: string };
  profileData: { bio?: string; location?: string };
  isLoading: boolean;
}

export function ProfileSection({
  user,
  profileData,
  isLoading,
}: ProfileSectionProps) {
  const form = useForm({
    defaultValues: {
      name: user.name || "",
      bio: profileData.bio || "",
      location: profileData.location || "",
    },
    validators: {
      onSubmit: updateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await apiClient.api.user.profile.put(value);
        if (error) throw error;
        toast.success("Profile updated successfully");
      } catch {
        toast.error("Failed to update profile");
      }
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (!isLoading) {
      form.setFieldValue("bio", profileData.bio || "");
      form.setFieldValue("location", profileData.location || "");
    }
  }, [isLoading, profileData, form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>Display Name</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      placeholder="Your name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <FieldError>
                        {field.state.meta.errors.map((error) => (
                          <p key={error?.message}>{error?.message}</p>
                        ))}
                      </FieldError>
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="bio">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>Bio</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id={field.name}
                      placeholder="Tell us about yourself..."
                      rows={3}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <FieldError>
                        {field.state.meta.errors.map((error) => (
                          <p key={error?.message}>{error?.message}</p>
                        ))}
                      </FieldError>
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Field name="location">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>Location</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      placeholder="City, Country"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.isTouched &&
                    field.state.meta.errors.length ? (
                      <FieldError>
                        {field.state.meta.errors.map((error) => (
                          <p key={error?.message}>{error?.message}</p>
                        ))}
                      </FieldError>
                    ) : null}
                  </FieldContent>
                </Field>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
