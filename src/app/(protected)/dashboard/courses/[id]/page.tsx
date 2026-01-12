"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  credits: z.string().optional(),
  isActive: z.boolean(),
});

export default function CourseEditPage() {
  const { id: code } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = code === "new";

  const courseQuery = useQuery({
    queryKey: ["admin", "course", code],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.courses
        .code({ code: code as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof courseSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.courses.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.courses
          .admin({ id: courseQuery.data?.id || (code as string) })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "Course created" : "Course updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "course", code] });
      if (isNew && data?.success) {
        router.push(`/dashboard/courses/${data.data.id}`);
      } else {
        router.push("/dashboard/courses");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: courseQuery.data?.name || "",
      code: courseQuery.data?.code || "",
      description: courseQuery.data?.description || "",
      credits: courseQuery.data?.credits || "",
      isActive: courseQuery.data?.isActive ?? true,
    } as z.infer<typeof courseSchema>,
    validators: {
      onChange: courseSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && courseQuery.isLoading) {
    return (
      <div className="container mx-auto space-y-6 pt-8">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-96 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New Course" : "Edit Course"}
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="name">
                  {(field) => (
                    <Field>
                      <FieldLabel>Course Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Data Structures"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="code">
                  {(field) => (
                    <Field>
                      <FieldLabel>Course Code</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. CT-201"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="A brief description of the course..."
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: typeof err === "string" ? err : err?.message,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="credits">
                {(field) => (
                  <Field>
                    <FieldLabel>Credits</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. 3"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Control whether this course is visible to users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="isActive">
                {(field) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FieldLabel>Active</FieldLabel>
                      <p className="text-muted-foreground text-sm">
                        {field.state.value
                          ? "Course is visible to users"
                          : "Course is hidden from users"}
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value as boolean}
                      onCheckedChange={field.handleChange}
                    />
                  </div>
                )}
              </form.Field>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="h-12 w-full"
            disabled={saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending
              ? "Saving..."
              : isNew
                ? "Create Course"
                : "Update Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
