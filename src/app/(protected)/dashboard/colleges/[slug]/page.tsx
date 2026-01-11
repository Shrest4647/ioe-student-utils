"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Globe, MapPin, Save } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

const collegeSchema = z.object({
  universityId: z.string().min(1, "University is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  isActive: z.boolean(),
});

const _departmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  isActive: z.boolean(),
});

const _programSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  credits: z.string().optional(),
  degreeLevels: z.enum([
    "certificate",
    "diploma",
    "associate",
    "undergraduate",
    "postgraduate",
    "doctoral",
    "postdoctoral",
  ]),
  isActive: z.boolean(),
});

const _courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  credits: z.string().optional(),
  isActive: z.boolean(),
});

export default function CollegeEditPage() {
  const { slug } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = slug === "new";

  const universitiesQuery = useQuery({
    queryKey: ["admin", "universities"],
    queryFn: async () => {
      const { data } = await apiClient.api.universities.get({
        query: { limit: "100" },
      });
      return data?.success ? data.data : [];
    },
  });

  const collegeQuery = useQuery({
    queryKey: ["admin", "college", slug],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.colleges
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.colleges.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.colleges
          .admin({ id: collegeQuery.data?.id || "" })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "College created" : "College updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "colleges"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "college", slug] });
      if (isNew && data?.success) {
        router.push(`/dashboard/colleges/${data.data.id}`);
      } else {
        router.push("/dashboard/colleges");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      universityId: collegeQuery.data?.universityId || "",
      name: collegeQuery.data?.name || "",
      description: collegeQuery.data?.description || "",
      websiteUrl: collegeQuery.data?.websiteUrl || "",
      location: collegeQuery.data?.location || "",
      type: collegeQuery.data?.type || "",
      isActive: collegeQuery.data?.isActive ?? true,
    } as z.infer<typeof collegeSchema>,
    validators: {
      onChange: collegeSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && collegeQuery.isLoading) {
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

  const universities = universitiesQuery.data || [];

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/colleges">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New College" : "Edit College"}
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
                    <FieldLabel>College Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Institute of Engineering"
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
                      placeholder="A brief description of the college..."
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
              <CardTitle>Contact & Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field name="universityId">
                {(field) => (
                  <Field>
                    <FieldLabel>University</FieldLabel>
                    <Select
                      value={field.state.value as string}
                      onValueChange={(v) => field.handleChange(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="type">
                  {(field) => (
                    <Field>
                      <FieldLabel>Type</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Constituent, Affiliated"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="location">
                  {(field) => (
                    <Field>
                      <FieldLabel>Location</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Pulchowk, Lalitpur"
                        />
                      </div>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
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
                Control whether this college is visible to users.
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
                          ? "College is visible to users"
                          : "College is hidden from users"}
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
                ? "Create College"
                : "Update College"}
          </Button>
        </div>
      </form>
    </div>
  );
}
