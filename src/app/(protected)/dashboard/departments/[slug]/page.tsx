"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, Save } from "lucide-react";
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

const departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  isActive: z.boolean(),
});

export default function DepartmentEditPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = slug === "new";

  const departmentQuery = useQuery({
    queryKey: ["admin", "department", slug],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.departments
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof departmentSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.departments.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.departments
          .admin({ id: departmentQuery.data?.id || "" })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "Department created" : "Department updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      queryClient.invalidateQueries({
        queryKey: ["admin", "department", slug],
      });
      if (isNew && data?.success) {
        router.push(`/dashboard/departments/${data.data.id}`);
      } else {
        router.push("/dashboard/departments");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: departmentQuery.data?.name || "",
      description: departmentQuery.data?.description || "",
      websiteUrl: departmentQuery.data?.websiteUrl || "",
      isActive: departmentQuery.data?.isActive ?? true,
    } as z.infer<typeof departmentSchema>,
    validators: {
      onChange: departmentSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && departmentQuery.isLoading) {
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
          <Link href="/dashboard/departments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New Department" : "Edit Department"}
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
              <form.Field name="name">
                {(field) => (
                  <Field>
                    <FieldLabel>Department Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Computer Engineering"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="A brief description of the department..."
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
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="websiteUrl">
                {(field) => (
                  <Field>
                    <FieldLabel>Website URL</FieldLabel>
                    <div className="relative">
                      <Globe className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Control whether this department is visible to users.
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
                          ? "Department is visible to users"
                          : "Department is hidden from users"}
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
                ? "Create Department"
                : "Update Department"}
          </Button>
        </div>
      </form>
    </div>
  );
}
