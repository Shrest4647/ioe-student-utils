"use client";

import { AnimatePresence, motion } from "framer-motion";
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
import { useProgramFilters } from "@/hooks/use-program-filters";

export function ProgramFilters() {
  const { filters, setFilter, debouncedSetSearch, resetFilters } =
    useProgramFilters();

  const degreeLevels = [
    { value: "certificate", label: "Certificate" },
    { value: "diploma", label: "Diploma" },
    { value: "associate", label: "Associate" },
    { value: "undergraduate", label: "Undergraduate" },
    { value: "postgraduate", label: "Postgraduate" },
    { value: "doctoral", label: "Doctoral" },
    { value: "postdoctoral", label: "Postdoctoral" },
  ];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-row space-x-4">
        <motion.div
          className="relative flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            className="pl-9"
            defaultValue={filters.search}
            onChange={(e) => debouncedSetSearch(e.target.value)}
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Select
            value={filters.degreeLevel}
            onValueChange={(val) =>
              setFilter("degreeLevel", val === "all" ? null : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Degree Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Degree Levels</SelectItem>
              {degreeLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      </div>
      <AnimatePresence>
        {(filters.degreeLevel || filters.search) && (
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 px-2 text-muted-foreground"
            >
              Reset Filters <XIcon className="ml-2 h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
