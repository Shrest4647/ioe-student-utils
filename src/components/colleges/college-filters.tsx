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
import { useUniversities } from "@/hooks/use-universities";

export function CollegeFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const universityId = searchParams.get("universityId");

  const { data } = useUniversities({});
  const universities = data?.pages.flatMap((page) => page.data) || [];

  const handleUniversityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("universityId");
    } else {
      params.set("universityId", value);
    }
    router.push(`/colleges?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Filters</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="university-filter">University</Label>
          <Select
            value={universityId || "all"}
            onValueChange={handleUniversityChange}
          >
            <SelectTrigger id="university-filter">
              <SelectValue placeholder="All universities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All universities</SelectItem>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
