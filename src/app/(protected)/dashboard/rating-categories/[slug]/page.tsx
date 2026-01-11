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

// Validation schema for rating category
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sortOrder: z.string().optional(),
  isActive: z.boolean(),
});

export type CategoryType = {
  name: string;
  description: string | null;
  sortOrder: string | null;
  isActive: boolean;
  slug: string;
  id: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdById: string | null;
  updatedById: string | null;
};

export default function RatingCategoryEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = slug === "new";

  // Fetch all categories and find the one we need when editing
  const { data: category, isLoading } = useQuery({
    queryKey: ["admin", "rating-categories"],
    queryFn: async () => {
      const { data } = await apiClient.api.ratings.categories
        .slug({ slug })
        .get();
      if (data?.success) {
        return data.data;
      }
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof categorySchema>) => {
      if (isNew) {
        const { data } =
          await apiClient.api.ratings.admin.categories.post(values);
        return data;
      } else if (category) {
        const { data } = await apiClient.api.ratings.admin
          .categories({ id: category?.id ?? "" })
          .patch(values);
        return data;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Category created" : "Category updated");
      queryClient.invalidateQueries({
        queryKey: ["admin", "rating-categories"],
      });
      if (isNew && (category?.id ?? true)) {
        router.push("/dashboard/rating-categories");
      } else {
        router.push("/dashboard/rating-categories");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      sortOrder: category?.sortOrder || "",
      isActive: category?.isActive ?? true,
    } as z.infer<typeof categorySchema>,
    validators: {
      onChange: categorySchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && (isLoading || !category)) {
    return (
      <div className="container mx-auto space-y-6 pt-8">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 pt-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/rating-categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New Rating Category" : "Edit Rating Category"}
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
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Category name"
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
                      rows={4}
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Optional description"
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="sortOrder">
                {(field) => (
                  <Field>
                    <FieldLabel>Sort Order</FieldLabel>
                    <Input
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. 10"
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
                Control whether this category is active.
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
                          ? "Category is active"
                          : "Category is inactive"}
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
                ? "Create Category"
                : "Update Category"}
          </Button>
        </div>
      </form>
    </div>
  );
}
