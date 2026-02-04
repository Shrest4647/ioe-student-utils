"use client";

import { X } from "lucide-react";
import { useState } from "react";

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
    <div className="scrollbar-hide flex items-center justify-center gap-2 overflow-x-auto pb-2">
      {chips.map((chip) => (
        <button
          type="button"
          key={chip.id}
          onClick={() => handleFilterClick(chip.id)}
          className={`whitespace-nowrap rounded-full px-4 py-2 font-medium text-sm transition-all ${
            activeFilter === chip.id
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }
          `}
          aria-pressed={activeFilter === chip.id}
        >
          {chip.label}
          {activeFilter === chip.id && (
            <X className="ml-1.5 inline h-3.5 w-3.5" />
          )}
        </button>
      ))}
    </div>
  );
}
