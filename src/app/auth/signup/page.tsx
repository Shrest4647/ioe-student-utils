"use client";

import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/auth-schemas";

export default function SignUp() {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      acceptTerms: false,
    },
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signUp.email(
          {
            email: value.email,
            password: value.password,
            name: `${value.firstName} ${value.lastName}`,
            callbackURL: "/dashboard",
            role: "user",
          },
          {
            onSuccess: async () => {
              router.push("/dashboard");
            },
            onError: (ctx) => {
              toast.error(ctx.error.message);
            },
          },
        );
      } catch (_error) {
        toast.error("Failed to create account");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="z-50 w-full max-w-md rounded-md rounded-t-none">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        <Label htmlFor={field.name}>First name</Label>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          placeholder="Max"
                          required
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.isTouched &&
                        field.state.meta.errors.length ? (
                          <FieldError>
                            {field.state.meta.errors.map((error) => (
                              <p key={`idx-${error?.message.slice(0, 10)}`}>
                                {error?.message}
                              </p>
                            ))}
                          </FieldError>
                        ) : null}
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        <Label htmlFor={field.name}>Last name</Label>
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id={field.name}
                          placeholder="Robinson"
                          required
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.isTouched &&
                        field.state.meta.errors.length ? (
                          <FieldError>
                            {field.state.meta.errors.map((error) => (
                              <p key={`idx-${error?.message.slice(0, 10)}`}>
                                {error?.message}
                              </p>
                            ))}
                          </FieldError>
                        ) : null}
                      </FieldContent>
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="email">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      <Label htmlFor={field.name}>Email</Label>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="email"
                        placeholder="m@example.com"
                        required
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
                          ))}
                        </FieldError>
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      <Label htmlFor={field.name}>Password</Label>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Password"
                      />
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
                          ))}
                        </FieldError>
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="passwordConfirmation">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      <Label htmlFor={field.name}>Confirm Password</Label>
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Confirm Password"
                      />
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
                          ))}
                        </FieldError>
                      ) : null}
                    </FieldContent>
                  </Field>
                )}
              </form.Field>

              <form.Field name="acceptTerms">
                {(field) => (
                  <Field>
                    <FieldContent>
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          id={field.name}
                          checked={field.state.value}
                          onCheckedChange={(checked) =>
                            field.handleChange(checked as boolean)
                          }
                        />
                        <Label htmlFor={field.name} className="text-sm">
                          I agree to the{" "}
                          <Link
                            href="#terms"
                            className="text-emerald-600 hover:underline"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="#privacy"
                            className="text-emerald-600 hover:underline"
                          >
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                      {field.state.meta.isTouched &&
                      field.state.meta.errors.length ? (
                        <FieldError>
                          {field.state.meta.errors.map((error) => (
                            <p key={`idx-${error?.message.slice(0, 10)}`}>
                              {error?.message}
                            </p>
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
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Create an account"
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-neutral-500 text-xs">
              Secured by <span className="text-orange-400">better-auth.</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
