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

const programSchema = z.object({
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

export default function ProgramEditPage() {
  const { id: code } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = code === "new";

  const programQuery = useQuery({
    queryKey: ["admin", "program", code],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api.programs
        .code({ code: code as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof programSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.programs.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.programs
          .admin({ id: programQuery.data?.id || (code as string) })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "Program created" : "Program updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "program", code] });
      if (isNew && data?.success) {
        router.push(`/dashboard/programs/${data.data.id}`);
      } else {
        router.push("/dashboard/programs");
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: programQuery.data?.name || "",
      code: programQuery.data?.code || "",
      description: programQuery.data?.description || "",
      credits: programQuery.data?.credits || "",
      degreeLevels: programQuery.data?.degreeLevels || "undergraduate",
      isActive: programQuery.data?.isActive ?? true,
    } as z.infer<typeof programSchema>,
    validators: {
      onChange: programSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (!isNew && programQuery.isLoading) {
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
          <Link href="/dashboard/programs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="font-bold text-2xl">
          {isNew ? "New Program" : "Edit Program"}
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
                      <FieldLabel>Program Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Bachelor of Computer Engineering"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="code">
                  {(field) => (
                    <Field>
                      <FieldLabel>Program Code</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. BCT"
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
                      placeholder="A brief description of the program..."
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
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="credits">
                  {(field) => (
                    <Field>
                      <FieldLabel>Credits</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. 140"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="degreeLevels">
                  {(field) => (
                    <Field>
                      <FieldLabel>Degree Level</FieldLabel>
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) => field.handleChange(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select degree level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="certificate">
                            Certificate
                          </SelectItem>
                          <SelectItem value="diploma">Diploma</SelectItem>
                          <SelectItem value="associate">Associate</SelectItem>
                          <SelectItem value="undergraduate">
                            Undergraduate
                          </SelectItem>
                          <SelectItem value="postgraduate">
                            Postgraduate
                          </SelectItem>
                          <SelectItem value="doctoral">Doctoral</SelectItem>
                          <SelectItem value="postdoctoral">
                            Postdoctoral
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Control whether this program is visible to users.
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
                          ? "Program is visible to users"
                          : "Program is hidden from users"}
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
                ? "Create Program"
                : "Update Program"}
          </Button>
        </div>
      </form>
    </div>
  );
}
