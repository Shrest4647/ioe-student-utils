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
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/eden";

type Step = "details" | "rounds";

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
    mutationFn: async (values: any) => {
      if (isNew) {
        const { data } = await apiClient.api.scholarships.admin.post(values);
        return data;
      } else {
        const { data } = await apiClient.api.scholarships
          .admin({ id: id as string })
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
    },
  });

  const addRoundMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data } = await apiClient.api.scholarships.admin.rounds.post({
        ...values,
        scholarshipId: id as string,
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
                      <FieldLabel>Scholarship Name</FieldLabel>
                      <Input
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Fulbright Foreign Student Program"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
                        }))}
                      />
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
                        <FieldError
                          errors={field.state.meta.errors.map((err: any) => ({
                            message: err as string,
                          }))}
                        />
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
                        <FieldError
                          errors={field.state.meta.errors.map((err: any) => ({
                            message: err as string,
                          }))}
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>
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
                          message: err as string,
                        }))}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="websiteUrl">
                  {(field) => (
                    <Field>
                      <FieldLabel>Official Website URL</FieldLabel>
                      <Input
                        type="url"
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((err: any) => ({
                          message: err as string,
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
                <CardTitle>Status & Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form.Field name="status">
                  {(field) => (
                    <Field>
                      <FieldLabel>Status</FieldLabel>
                      <Select
                        value={field.state.value as string}
                        onValueChange={field.handleChange}
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
                        onValueChange={field.handleChange}
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
                        options={countries.map((c: any) => ({
                          label: c.name,
                          value: c.code,
                        }))}
                        selected={field.state.value as string[]}
                        onChange={field.handleChange}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="degreeIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Degree Levels</FieldLabel>
                      <MultiSelect
                        options={degrees.map((d: any) => ({
                          label: d.name,
                          value: d.id,
                        }))}
                        selected={field.state.value as string[]}
                        onChange={field.handleChange}
                      />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="fieldIds">
                  {(field) => (
                    <Field>
                      <FieldLabel>Fields of Study</FieldLabel>
                      <MultiSelect
                        options={fields.map((f: any) => ({
                          label: f.name,
                          value: f.id,
                        }))}
                        selected={field.state.value as string[]}
                        onChange={field.handleChange}
                      />
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
    mutationFn: async (values: any) => {
      const { data } = await apiClient.api.scholarships.admin
        .rounds({ roundId: round.id })
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
    },
    onSubmit: async ({ value }) => {
      onAdd(value);
      setIsOpen(false);
      form.reset();
    },
  });

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Round
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
      <h3 className="font-bold">New Round</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="roundName">
          {(field) => (
            <Field>
              <FieldLabel>Round Name</FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. 2025 General Intake"
              />
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
            </Field>
          )}
        </form.Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="openDate">
          {(field) => (
            <Field>
              <FieldLabel>Open Date</FieldLabel>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="deadlineDate">
          {(field) => (
            <Field>
              <FieldLabel>Deadline Date</FieldLabel>
              <Input
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </Field>
          )}
        </form.Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => form.handleSubmit()}>
          Save Round
        </Button>
      </div>
    </div>
  );
}

function AddEventModal({ onAdd }: { onAdd: (values: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      name: "",
      date: "",
      type: "milestone",
      description: "",
    },
    onSubmit: async ({ value }) => {
      onAdd(value);
      setIsOpen(false);
      form.reset();
    },
  });

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        className="h-7 text-[10px]"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Event
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-3 rounded-md border bg-background p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <form.Field name="name">
          {(field) => (
            <Field>
              <FieldLabel className="text-[10px]">Event Name</FieldLabel>
              <Input
                className="h-8 text-xs"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Webinar"
              />
            </Field>
          )}
        </form.Field>
        <form.Field name="type">
          {(field) => (
            <Field>
              <FieldLabel className="text-[10px]">Type</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={field.handleChange}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="result_announcement">Result</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>
      <form.Field name="date">
        {(field) => (
          <Field>
            <FieldLabel className="text-[10px]">Date</FieldLabel>
            <Input
              className="h-8 text-xs"
              type="date"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      </form.Field>
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => form.handleSubmit()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function MultiSelect({ options, selected, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-[40px] flex-wrap gap-1 rounded-md border bg-background p-2">
        {selected.length === 0 && (
          <span className="text-muted-foreground text-sm">Select...</span>
        )}
        {selected.map((val: string) => {
          const opt = options.find((o: any) => o.value === val);
          return (
            <Badge key={val} variant="secondary" className="gap-1">
              {opt?.label || val}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() =>
                  onChange(selected.filter((v: string) => v !== val))
                }
              />
            </Badge>
          );
        })}
      </div>
      <Select
        onValueChange={(val) =>
          !selected.includes(val) && onChange([...selected, val])
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Add more..." />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: any) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
