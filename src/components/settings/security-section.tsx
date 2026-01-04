"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2, Lock } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { changePasswordSchema } from "@/lib/auth-schemas";

export function SecuritySection() {
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        if (error) throw error;
        toast.success("Password changed successfully");
        form.reset();
      } catch {
        toast.error("Failed to change password");
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.Field name="currentPassword">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>Current Password</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="password"
                      placeholder="Enter current password"
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

            <Separator />

            <form.Field name="newPassword">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>New Password</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="password"
                      placeholder="Enter new password"
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

            <form.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel>
                    <Label htmlFor={field.name}>Confirm New Password</Label>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id={field.name}
                      type="password"
                      placeholder="Confirm new password"
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
                    <Lock className="mr-2 h-4 w-4" />
                  )}
                  Change Password
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
