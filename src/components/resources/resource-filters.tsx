"use client";

import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResourceFiltersProps {
  categories: { id: string; name: string }[];
  contentTypes: { id: string; name: string }[];
  filters: {
    category: string;
    contentType: string;
    search: string;
  };
  setFilters: (filters: any) => void;
}

export function ResourceFilters({
  categories,
  contentTypes,
  filters,
  setFilters,
}: ResourceFiltersProps) {
  const hasFilters = filters.category || filters.contentType || filters.search;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="grow space-y-2">
          <Label
            htmlFor="search-input"
            className="font-semibold text-muted-foreground text-sm uppercase tracking-wider"
          >
            Search
          </Label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search resources..."
              className="h-11 rounded-lg pl-9"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>
        </div>

        <div className="w-full space-y-2 md:w-56">
          <Label
            htmlFor="topic-filter"
            className="font-semibold text-muted-foreground text-sm uppercase tracking-wider"
          >
            Topic
          </Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(val) =>
              setFilters({ ...filters, category: val === "all" ? "" : val })
            }
          >
            <SelectTrigger id="topic-filter" className="h-11 rounded-lg">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 md:w-56">
          <Label
            htmlFor="type-filter"
            className="font-semibold text-muted-foreground text-sm uppercase tracking-wider"
          >
            Content Type
          </Label>
          <Select
            value={filters.contentType || "all"}
            onValueChange={(val) =>
              setFilters({ ...filters, contentType: val === "all" ? "" : val })
            }
          >
            <SelectTrigger id="type-filter" className="h-11 rounded-lg">
              <SelectValue placeholder="All Content Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content Types</SelectItem>
              {contentTypes.map((ct) => (
                <SelectItem key={ct.id} value={ct.id}>
                  {ct.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Active Filters:</span>
          {filters.category && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              {categories.find((c) => c.id === filters.category)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, category: "" })}
              />
            </Badge>
          )}
          {filters.contentType && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              {contentTypes.find((ct) => ct.id === filters.contentType)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, contentType: "" })}
              />
            </Badge>
          )}
          {filters.search && (
            <Badge variant="secondary" className="gap-1 px-2 py-1">
              "{filters.search}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, search: "" })}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground text-xs"
            onClick={() =>
              setFilters({ category: "", contentType: "", search: "" })
            }
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
