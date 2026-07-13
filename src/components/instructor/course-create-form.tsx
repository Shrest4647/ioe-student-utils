"use client";

import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildCanonicalCourseSlug } from "@/lib/course-slug";
import { apiClient } from "@/lib/eden";

export function CourseCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const slug = useMemo(
    () => buildCanonicalCourseSlug({ code, name }),
    [code, name],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.api[
        "course-explorer"
      ].admin.courses.post({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        slug,
        description: description.trim() || undefined,
        credits: credits.trim() || undefined,
        isActive: true,
      });
      if (!response.data?.success) throw new Error("Failed to create course");
      toast.success("Course created");
      router.push(`/course-explorer/instructor/courses/${slug}/edit`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create course",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/course-explorer/instructor/courses"
        className="inline-flex items-center gap-2 text-muted-foreground text-sm hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Instructor courses
      </Link>
      <h1 className="mt-6 font-semibold text-3xl">Create course outline</h1>
      <p className="mt-2 text-muted-foreground">
        Create the course identity first, then add units and topics in the graph
        editor.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="course-name">Course name</Label>
          <Input
            id="course-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="course-code">Course code</Label>
            <Input
              id="course-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="CT 501"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="course-credits">Credits</Label>
            <Input
              id="course-credits"
              value={credits}
              onChange={(event) => setCredits(event.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-slug">Public slug</Label>
          <Input id="course-slug" value={slug} readOnly aria-readonly="true" />
          <p className="text-muted-foreground text-xs">
            Generated from the course code and used in readable URLs.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="course-description">Description</Label>
          <Textarea
            id="course-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
          />
        </div>
        <Button type="submit" disabled={isSubmitting || !name || !code}>
          <Plus className="size-4" />
          {isSubmitting ? "Creating…" : "Create and edit outline"}
        </Button>
      </form>
    </main>
  );
}
