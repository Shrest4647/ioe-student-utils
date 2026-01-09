"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useScholarshipFilters } from "@/hooks/use-scholarship-filters";

interface TaxonomyOption {
  id?: string;
  code?: string;
  name: string;
}

interface ScholarshipFiltersProps {
  countries: TaxonomyOption[];
  degrees: TaxonomyOption[];
  fields: TaxonomyOption[];
}

export function ScholarshipFilters({
  countries,
  degrees,
  fields,
}: ScholarshipFiltersProps) {
  const { filters, setFilter, debouncedSetSearch } = useScholarshipFilters();

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search scholarships, providers..."
          className="pl-9"
          defaultValue={filters.search}
          onChange={(e) => debouncedSetSearch(e.target.value)}
        />
      </div>

      {/* Filters Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Country Filter */}
        <Select
          value={filters.country}
          onValueChange={(val) =>
            setFilter("country", val === "all" ? null : val)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.code || c.id} value={c.code || (c.id ?? "")}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Degree Filter */}
        <Select
          value={filters.degree}
          onValueChange={(val) =>
            setFilter("degree", val === "all" ? null : val)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Degrees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Degrees</SelectItem>
            {degrees.map((d) => (
              <SelectItem key={d.id} value={d.id ?? ""}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Field Filter */}
        <Select
          value={filters.field}
          onValueChange={(val) =>
            setFilter("field", val === "all" ? null : val)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Fields" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            {fields.map((f) => (
              <SelectItem key={f.id} value={f.id ?? ""}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display (Optional, can be added for UX) */}
      {(filters.country ||
        filters.degree ||
        filters.field ||
        filters.search) && (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilter("country", null);
              setFilter("degree", null);
              setFilter("field", null);
              setFilter("search", "");
              // Reset search input value manually if needed or let it re-render
            }}
            className="h-8 px-2 text-muted-foreground"
          >
            Reset Filters <XIcon className="ml-2 h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
