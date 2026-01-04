"use client";

import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { authClient } from "@/lib/auth-client";
import { deleteAccountSchema } from "@/lib/auth-schemas";
import { apiClient } from "@/lib/eden";

export function DangerZoneSection() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmText: "",
    },
    validators: {
      onSubmit: deleteAccountSchema,
    },
    onSubmit: async ({ value }) => {
      setIsDeleting(true);
      try {
        const { error } = await apiClient.api.user["delete-account"].post({
          password: value.password,
        });

        if (error) {
          throw new Error(
            error.value &&
              typeof error.value === "object" &&
              "error" in error.value
              ? (error.value as { error: string }).error
              : "Failed to delete account",
          );
        }

        toast.success("Account deleted successfully");
        await authClient.signOut();
        router.push("/");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete account",
        );
      } finally {
        setIsDeleting(false);
      }
    },
  });

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <div className="space-y-4 py-4">
                <form.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        <Label htmlFor={field.name}>
                          Enter your password to confirm
                        </Label>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          type="password"
                          placeholder="Your password"
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

                <form.Field name="confirmText">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        <Label htmlFor={field.name}>
                          Type <span className="font-bold">DELETE</span> to
                          confirm
                        </Label>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          placeholder="DELETE"
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
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <AlertDialogAction
                      type="submit"
                      disabled={!canSubmit || isSubmitting || isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isSubmitting || isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Account
                    </AlertDialogAction>
                  )}
                </form.Subscribe>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
