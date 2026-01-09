"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarCheck,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

type Step = "details" | "rounds";

const scholarshipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase alphanumeric and hyphens only",
    ),
  description: z.string().min(1, "Description is required"),
  providerName: z.string().min(1, "Provider name is required"),
  websiteUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (starting with http:// or https://)")
    .or(z.literal("")),
  fundingType: z.enum(["fully_funded", "partial", "tuition_only"]),
  status: z.enum(["active", "inactive", "archived"]),
  countryCodes: z.array(z.string()),
  degreeIds: z.array(z.string()),
  fieldIds: z.array(z.string()),
});

const roundSchema = z.object({
  roundName: z.string().min(1, "Round name is required"),
  openDate: z.string().min(1, "Open date is required"),
  deadlineDate: z.string().min(1, "Deadline date is required"),
  isActive: z.boolean(),
});

const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["webinar", "interview", "result_announcement", "deadline"]),
  description: z.string().optional(),
});

export default function ScholarshipEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [currentStep, setCurrentStep] = useState<Step>("details");

  // --- Data Fetching ---
  const taxonomyQuery = useQuery({
    queryKey: ["admin", "taxonomy"],
    queryFn: async () => {
      const [c, d, f] = await Promise.all([
        apiClient.api.scholarships.countries.get(),
        apiClient.api.scholarships.degrees.get(),
        apiClient.api.scholarships.fields.get(),
      ]);
      return {
        countries: c.data?.success ? c.data.data : [],
        degrees: d.data?.success ? d.data.data : [],
        fields: f.data?.success ? f.data.data : [],
      };
    },
  });

  const scholarshipQuery = useQuery({
    queryKey: ["admin", "scholarship", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data } = await apiClient.api
        .scholarships({ slug: id as string })
        .get();
      return data?.success ? data.data : null;
    },
    enabled: !isNew,
  });

  // --- Mutations ---
  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof scholarshipSchema>) => {
      if (isNew) {
        const { data } = await apiClient.api.scholarships.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.scholarships
          .admin({ id: scholarshipQuery.data?.id || (id as string) })
          .patch(values);
        return data;
      }
    },
    onSuccess: (data: any) => {
      toast.success(isNew ? "Scholarship created" : "Scholarship updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "scholarships"] });
      if (isNew && data?.success) {
        router.push(`/dashboard/scholarships/${data.data.id}`);
      }
      setCurrentStep("rounds");
    },
  });

  const addRoundMutation = useMutation({
    mutationFn: async (values: z.infer<typeof roundSchema>) => {
      const { data } = await apiClient.api.scholarships.admin.rounds.post({
        ...values,
        scholarshipId: scholarshipQuery.data?.id || (id as string),
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "scholarship", id] });
      toast.success("Round added");
    },
  });

  // --- Form Setup ---
  const form = useForm({
    defaultValues: {
      name: scholarshipQuery.data?.name || "",
      slug: scholarshipQuery.data?.slug || "",
      description: scholarshipQuery.data?.description || "",
      providerName: scholarshipQuery.data?.providerName || "",
      websiteUrl: scholarshipQuery.data?.websiteUrl || "",
      fundingType:
        (scholarshipQuery.data?.fundingType as any) || "fully_funded",
      status: (scholarshipQuery.data?.status as any) || "active",
      countryCodes:
        scholarshipQuery.data?.countries?.map((c: any) => c.countryCode) || [],
      degreeIds:
        scholarshipQuery.data?.degrees?.map((d: any) => d.degreeId) || [],
      fieldIds: scholarshipQuery.data?.fields?.map((f: any) => f.fieldId) || [],
    } as z.infer<typeof scholarshipSchema>,
    validators: {
      onChange: scholarshipSchema,
    },
    onSubmit: async ({ value }) => {
      saveMutation.mutate(value);
    },
  });

  if (taxonomyQuery.isLoading || (!isNew && scholarshipQuery.isLoading)) {
    return (
      <div className="space-y-6">
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

  const { countries, degrees, fields } = taxonomyQuery.data || {
    countries: [],
    degrees: [],
    fields: [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/scholarships">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="font-bold text-2xl">
            {isNew ? "New Scholarship" : "Edit Scholarship"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentStep === "details" ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentStep("details")}
          >
            1. Details
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={currentStep === "rounds" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (isNew) {
                toast.error(
                  "Please save the scholarship first to manage rounds.",
                );
              } else {
                setCurrentStep("rounds");
              }
            }}
            disabled={isNew}
          >
            2. Rounds & Events
          </Button>
        </div>
      </div>

      {currentStep === "details" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="name">
                  {(field) => (
                    <Field>
                      <FieldLabel>Scholarship Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Fulbright Foreign Student Program"
                      />
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <form.Field name="slug">
                    {(field) => (
                      <Field>
                        <FieldLabel>Slug (URL path)</FieldLabel>
                        <Input
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="fulbright-scholarship"
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="providerName">
                    {(field) => (
                      <Field>
                        <FieldLabel>Provider Name</FieldLabel>
                        <Input
                          value={field.state.value as string}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="DAAD, Gates Foundation, etc."
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </Field>
                    )}
                  </form.Field>
                </div>
                <form.Field name="websiteUrl">
                  {(field) => (
                    <Field>
                      <FieldLabel>Official Website URL</FieldLabel>
                      <Input
                        type="text"
                        placeholder="https://example.com"
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: typeof err === "string" ? err : err?.message,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="description">
                  {(field) => (
                    <Field>
                      <FieldLabel>Description (Markdown supported)</FieldLabel>
                      <Textarea
                        rows={6}
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
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
                <CardTitle>Status & Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="status">
                  {(field) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) =>
                          field.handleChange(
                            v as z.infer<typeof scholarshipSchema>["status"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="fundingType">
                  {(field) => (
                    <Field>
                      <FieldLabel>Funding Type</FieldLabel>
                      <Select
                        value={field.state.value as string}
                        onValueChange={(v) =>
                          field.handleChange(
                            v as z.infer<
                              typeof scholarshipSchema
                            >["fundingType"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fully_funded">
                            Fully Funded
                          </SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="tuition_only">
                            Tuition Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Taxonomy</CardTitle>
                <CardDescription>
                  Select applicable target areas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="countryCodes">
                  {(field) => (
                    <Field>
                      <FieldLabel>Target Countries</FieldLabel>
                      <MultiSelect
                        values={field.state.value as string[]}
                        onValuesChange={field.handleChange}
                      >
                        <MultiSelectTrigger className="w-full max-w-[400px]">
                          <MultiSelectValue placeholder="Select frameworks..." />
                        </MultiSelectTrigger>
                        <MultiSelectContent>
                          <MultiSelectGroup>
                            {countries.map((c) => (
                              <MultiSelectItem key={c.code} value={c.code}>
                                {c.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        </MultiSelectContent>
                      </MultiSelect>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="degreeIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Degree Levels</FieldLabel>
                      <MultiSelect
                        values={field.state.value as string[]}
                        onValuesChange={field.handleChange}
                      >
                        <MultiSelectTrigger className="w-full max-w-[400px]">
                          <MultiSelectValue placeholder="Select frameworks..." />
                        </MultiSelectTrigger>
                        <MultiSelectContent>
                          <MultiSelectGroup>
                            {degrees.map((d) => (
                              <MultiSelectItem key={d.id} value={d.id}>
                                {d.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        </MultiSelectContent>
                      </MultiSelect>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="fieldIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Fields of Study</FieldLabel>
                      <MultiSelect
                        values={field.state.value as string[]}
                        onValuesChange={field.handleChange}
                      >
                        <MultiSelectTrigger className="w-full max-w-[400px]">
                          <MultiSelectValue placeholder="Select frameworks..." />
                        </MultiSelectTrigger>
                        <MultiSelectContent>
                          <MultiSelectGroup>
                            {fields.map((f) => (
                              <MultiSelectItem key={f.id} value={f.id}>
                                {f.name}
                              </MultiSelectItem>
                            ))}
                          </MultiSelectGroup>
                        </MultiSelectContent>
                      </MultiSelect>
                    </Field>
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
                  ? "Create Scholarship"
                  : "Update Scholarship"}
            </Button>
          </div>
        </form>
      )}

      {currentStep === "rounds" && !isNew && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Rounds</CardTitle>
                  <CardDescription>
                    Manage intake periods and their associated events.
                  </CardDescription>
                </div>
                <AddRoundModal onAdd={(v) => addRoundMutation.mutate(v)} />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {scholarshipQuery.data?.rounds?.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                      No rounds defined yet.
                    </p>
                  ) : (
                    scholarshipQuery.data?.rounds?.map((round: any) => (
                      <RoundCard
                        key={round.id}
                        round={round}
                        scholarshipId={id as string}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Round Summary</CardTitle>
                <CardDescription>
                  Quick overview of application timeline.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scholarshipQuery.data?.rounds?.length === 0 && (
                    <p className="py-2 text-muted-foreground text-xs italic">
                      No rounds scheduled.
                    </p>
                  )}
                  {scholarshipQuery.data?.rounds?.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex flex-col gap-1 border-primary border-l-2 pl-4"
                    >
                      <span className="font-medium text-sm">{r.roundName}</span>
                      <span className="text-muted-foreground text-xs">
                        {r.openDate
                          ? format(new Date(r.openDate), "MMM d")
                          : "TBD"}{" "}
                        -{" "}
                        {r.deadlineDate
                          ? format(new Date(r.deadlineDate), "MMM d")
                          : "TBD"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button
              variant="outline"
              className="h-12 w-full"
              onClick={() => setCurrentStep("details")}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RoundCard({
  round,
  scholarshipId,
}: {
  round: any;
  scholarshipId: string;
}) {
  const queryClient = useQueryClient();
  const addEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof eventSchema>) => {
      const { data } = await apiClient.api.scholarships.admin
        .rounds({ id: round.id })
        .events.post(values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "scholarship", scholarshipId],
      });
      toast.success("Event added");
    },
  });

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-lg">
          {round.roundName || "Unnamed Round"}
        </h4>
        <div className="flex items-center gap-2">
          <Badge variant={round.isActive ? "default" : "secondary"}>
            {round.isActive ? "Active" : "Inactive"}
          </Badge>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 rounded bg-muted/50 p-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-bold text-[10px] text-muted-foreground uppercase">
              Open Date
            </p>
            <p>
              {round.openDate ? format(new Date(round.openDate), "PP") : "TBD"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded bg-muted/50 p-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-bold text-[10px] text-muted-foreground uppercase">
              Deadline
            </p>
            <p>
              {round.deadlineDate
                ? format(new Date(round.deadlineDate), "PP")
                : "TBD"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <h5 className="flex items-center gap-2 font-semibold text-sm">
            <CalendarCheck className="h-4 w-4" />
            Milestone Events
          </h5>
          <AddEventModal onAdd={(v) => addEventMutation.mutate(v)} />
        </div>
        <div className="space-y-2">
          {round.events?.length === 0 ? (
            <p className="py-2 text-center text-muted-foreground text-xs">
              No events scheduled.
            </p>
          ) : (
            round.events?.map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded bg-muted/30 p-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-[80px] font-medium text-primary text-xs uppercase">
                    {event.type.replace("_", " ")}
                  </span>
                  <span>{event.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AddRoundModal({ onAdd }: { onAdd: (values: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      roundName: "",
      openDate: "",
      deadlineDate: "",
      isActive: true,
    } as z.infer<typeof roundSchema>,
    validators: {
      onChange: roundSchema,
    },
    onSubmit: async ({ value }) => {
      onAdd(value);
      setIsOpen(false);
      form.reset();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Round
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Round</DialogTitle>
          <DialogDescription>
            Add a new application round for this scholarship.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="roundName">
              {(field) => (
                <Field>
                  <FieldLabel>Round Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. 2025 General Intake"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="isActive">
              {(field) => (
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={field.state.value ? "true" : "false"}
                    onValueChange={(v) => field.handleChange(v === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={field.state.meta.errors.map((err: any) => ({
                      message: typeof err === "string" ? err : err?.message,
                    }))}
                  />
                </Field>
              )}
            </form.Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="openDate">
              {(field) => (
                <Field>
                  <FieldLabel>Open Date</FieldLabel>
                  <DateInput
                    value={field.state.value}
                    onChange={(v) =>
                      field.handleChange(v ? v.toISOString() : "")
                    }
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="deadlineDate">
              {(field) => (
                <Field>
                  <FieldLabel>Deadline Date</FieldLabel>
                  <DateInput
                    value={field.state.value}
                    onChange={(v) =>
                      field.handleChange(v ? v.toISOString() : "")
                    }
                  />

                  <FieldError
                    errors={field.state.meta.errors.map((err: any) => ({
                      message: typeof err === "string" ? err : err?.message,
                    }))}
                  />
                </Field>
              )}
            </form.Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => form.handleSubmit()}>Save Round</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddEventModal({ onAdd }: { onAdd: (values: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      name: "",
      date: "",
      type: "webinar",
      description: "",
    } as z.infer<typeof eventSchema>,
    validators: {
      onChange: eventSchema,
    },
    onSubmit: async ({ value }) => {
      onAdd(value);
      setIsOpen(false);
      form.reset();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-7 text-[10px]">
          <Plus className="mr-1 h-3 w-3" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            Add a milestone event to this scholarship round.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>Event Name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Webinar"
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
            <form.Field name="type">
              {(field) => (
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(
                        v as z.infer<typeof eventSchema>["type"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="result_announcement">
                        Result
                      </SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>
          </div>
          <form.Field name="date">
            {(field) => (
              <Field>
                <FieldLabel>Date</FieldLabel>
                <DateInput
                  value={field.state.value}
                  onChange={(v) => field.handleChange(v ? v.toISOString() : "")}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => form.handleSubmit()}>Add Event</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
