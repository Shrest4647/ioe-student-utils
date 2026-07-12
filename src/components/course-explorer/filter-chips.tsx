"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FilterChipsProps {
  courses: Array<{
    units: Array<{ name: string }>;
    credits: string | null;
  }>;
}

export function FilterChips({ courses }: FilterChipsProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Extract unique departments from unit names (first word)
  const departments = Array.from(
    new Set(
      courses.flatMap((c) =>
        c.units.map((u) => u.name.split(" ")[0]).filter(Boolean),
      ),
    ),
  ).slice(0, 5);

  const chips = [
    { id: "all", label: "All Courses" },
    { id: "core", label: "Core Topics" },
    ...departments.map((d) => ({ id: d.toLowerCase(), label: d })),
  ];

  const handleFilterClick = (chipId: string) => {
    setActiveFilter(activeFilter === chipId ? null : chipId);
  };

  return (
    <div className="scrollbar-hide flex items-center justify-center gap-2.5 overflow-x-auto px-4 pb-2">
      {chips.map((chip) => {
        const isActive = activeFilter === chip.id;
        return (
          <button
            type="button"
            key={chip.id}
            onClick={() => handleFilterClick(chip.id)}
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-semibold text-[11px] uppercase tracking-wide transition-all duration-300",
              isActive
                ? "bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
                : "border border-border bg-card shadow-sm backdrop-blur-md hover:border-muted-foreground/30 hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {chip.label}
            {isActive && <X className="h-3 w-3" />}
          </button>
        );
      })}
    </div>
  );
}
