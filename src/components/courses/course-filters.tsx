"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CourseFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get("programId");

  const handleProgramChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("programId");
    } else {
      params.set("programId", value);
    }
    router.push(`/courses?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Filters</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-filter">Filter by Program</Label>
          <Select
            value={programId || "all"}
            onValueChange={handleProgramChange}
          >
            <SelectTrigger id="program-filter">
              <SelectValue placeholder="All programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            More filters coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
