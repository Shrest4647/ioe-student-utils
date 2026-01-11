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

export function ProgramFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const degreeLevel = searchParams.get("degreeLevel");

  const degreeLevels = [
    { value: "certificate", label: "Certificate" },
    { value: "diploma", label: "Diploma" },
    { value: "associate", label: "Associate" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "postgraduate", label: "Postgraduate" },
    { value: "doctoral", label: "Doctoral" },
    { value: "postdoctoral", label: "Postdoctoral" },
  ];

  const handleDegreeLevelChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("degreeLevel");
    } else {
      params.set("degreeLevel", value);
    }
    router.push(`/programs?${params.toString()}`);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Filters</h2>
      </div>
      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="degree-level-filter">Degree Level</Label>
          <Select
            value={degreeLevel || "all"}
            onValueChange={handleDegreeLevelChange}
          >
            <SelectTrigger id="degree-level-filter">
              <SelectValue placeholder="All degree levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All degree levels</SelectItem>
              {degreeLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
