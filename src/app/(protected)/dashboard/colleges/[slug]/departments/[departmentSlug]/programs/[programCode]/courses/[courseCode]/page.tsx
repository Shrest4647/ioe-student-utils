"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Book } from "lucide-react";
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

const collegeCourseSchema = z.object({
  code: z.string().optional(),
  description: z.string().optional(),
  credits: z.string().optional(),
  isActive: z.boolean(),
});

export default function CollegeCourseEditPage() {
  const { slug, departmentSlug, programCode, courseCode } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const collegeQuery = useQuery({
    queryKey: ["admin", "college", slug],
    queryFn: async () => {
      const { data } = await apiClient.api.colleges
        .slug({ slug: slug as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const departmentQuery = useQuery({
    queryKey: ["admin", "department", departmentSlug],
    queryFn: async () => {
      const { data } = await apiClient.api.departments
        .slug({ slug: departmentSlug as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const programQuery = useQuery({
    queryKey: ["admin", "program", programCode],
    queryFn: async () => {
      const { data } = await apiClient.api.programs
        .code({ code: programCode as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const courseQuery = useQuery({
    queryKey: ["admin", "course", courseCode],
    queryFn: async () => {
      const { data } = await apiClient.api.courses
        .code({ code: courseCode as string })
        .get();
      return data?.success ? data.data : null;
    },
  });

  const collegeCourseQuery = useQuery({
    queryKey: [
      "admin",
      "collegeCourse",
      slug,
      departmentSlug,
      programCode,
      courseCode,
    ],
    queryFn: async () => {
      const collegeId = collegeQuery?.data?.id;
      const departmentId = departmentQuery?.data?.id;
      const programId = programQuery?.data?.id;
      const courseId = courseQuery?.data?.id;

      if (!collegeId || !departmentId || !programId || !courseId) {
        throw new Error("Missing college, department, or program ID");
      }

      const { data } = await apiClient.api
        .colleges({ id: collegeId })
        .departments({ departmentId })
        .programs({ programId })
        .courses({ courseId })
        .get();

      if (data?.success) {
        return data?.data;
      }
    },
    enabled:
      !!collegeQuery.data?.id &&
      !!departmentQuery.data?.id &&
      !!programQuery.data?.id &&
      !!courseQuery.data?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof collegeCourseSchema>) => {
      const collegeId = collegeQuery?.data?.id;
      const departmentId = departmentQuery?.data?.id;
      const programId = programQuery?.data?.id;
      const courseId = courseQuery?.data?.id;

      if (!collegeId || !departmentId || !programId || !courseId) {
        throw new Error("Missing college, department, or program ID");
      }
      const { data } = await apiClient.api.colleges
        .admin({ id: collegeId })
        .departments({ departmentId })
        .programs({ programId })
        .courses({ courseId })
        .patch(values);

      if (data?.success) {
        return data;
      }
    },
    onSuccess: (_data: any) => {
      toast.success("College course updated");
      queryClient.invalidateQueries({
        queryKey: [
          "admin",
          "collegeCourse",
          slug,
          departmentSlug,
          programCode,
          courseCode,
        ],
      });
      router.push(
        `/dashboard/colleges/${slug}/departments/${departmentSlug}/programs/${programCode}`,
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: {
      code: collegeCourseQuery.data?.code || courseQuery.data?.code || "",
      description:
        collegeCourseQuery.data?.description ||
        courseQuery.data?.description ||
        "",
      credits:
        collegeCourseQuery.data?.credits || courseQuery.data?.credits || "",
      isActive: collegeCourseQuery.data?.isActive ?? true,
    } as z.infer<typeof collegeCourseSchema>,
    validators: {
      onChange: collegeCourseSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (
    !collegeQuery.data ||
    !departmentQuery.data ||
    !programQuery.data ||
    !courseQuery.data ||
    (!collegeCourseQuery.data && collegeCourseQuery.isLoading)
  ) {
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

  const collegeCourse = collegeCourseQuery.data;
  const course = courseQuery.data;
  const program = programQuery.data;
  const department = departmentQuery.data;
  const college = collegeQuery.data;

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link
            href={`/dashboard/colleges/${slug}/departments/${departmentSlug}/programs/${programCode}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-bold text-2xl">
            {course.name} - {program.name} - {department.name} - {college.name}
          </h2>
          <p className="text-muted-foreground">
            Customize course information for {college.name} - {department.name}{" "}
            - {program.name}
          </p>
        </div>
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
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Customize how this course appears for {college.name} -{" "}
                {department.name} - {program.name}. These values will override
                the general course information if provided.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="font-medium text-sm">General Course</div>
                <div className="text-muted-foreground text-sm">
                  {course.description || "No description"}
                </div>
                {course.code && (
                  <div className="mt-2">
                    <span className="font-medium text-sm">Code: </span>
                    <span className="text-sm">{course.code}</span>
                  </div>
                )}
                {course.credits && (
                  <div className="mt-1">
                    <span className="font-medium text-sm">Credits: </span>
                    <span className="text-sm">{course.credits}</span>
                  </div>
                )}
              </div>

              <form.Field name="code">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Course Code</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={course.code || "e.g. CT-201"}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Description</FieldLabel>
                    <Textarea
                      rows={6}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Custom description for this college course (leave empty to use general course description)"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((err: any) => ({
                        message: typeof err === "string" ? err : err?.message,
                      }))}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="credits">
                {(field) => (
                  <Field>
                    <FieldLabel>Custom Credits</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={course.credits || "e.g. 3"}
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
                Control whether this course is visible for {college.name} -{" "}
                {department.name} - {program.name}.
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
                          ? "Course is visible"
                          : "Course is hidden"}
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
            <Book className="mr-2 h-4 w-4" />
            {saveMutation.isPending
              ? "Saving..."
              : collegeCourse
                ? "Update College Course"
                : "Create College Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
