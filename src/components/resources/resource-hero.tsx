"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceFilters } from "./resource-filters";

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

export function ResourceHero({
  categories,
  contentTypes,
  filters,
  setFilters,
}: ResourceFiltersProps) {
  return (
    <section className="relative overflow-hidden bg-[#002b2d] py-8 text-white lg:py-10">
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 h-full w-1/3 bg-[#d1e8e2] opacity-10 lg:opacity-20"
        style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 font-bold text-3xl leading-tight md:text-3xl"
          >
            Resource Library<span className="text-orange-500">.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-gray-300 text-sm md:text-base"
          >
            Browse academic resources, tools, guides, templates, and more — all
            designed to help IOE students excel in their studies and global
            applications.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="default"
              className="h-9 bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700"
            >
              <Link href="#resources-main">Explore All Resources</Link>
            </Button>
            <Button
              asChild
              size="default"
              variant="outline"
              className="h-9 border-white/30 px-6 font-semibold text-white hover:bg-white/10"
            >
              <a
                href="https://discord.gg/ioe-student-community"
                target="_blank"
                rel="noopener noreferrer"
              >
                Join Community
              </a>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative mx-auto mt-6 max-w-xl"
          >
            <Input
              type="text"
              placeholder="Search all resources..."
              className="h-10 w-full rounded-full border-white/20 bg-white/10 pr-6 pl-10 text-sm text-white placeholder:text-gray-400 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={filters.search || ""}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-4 max-w-xl"
          >
            <ResourceFilters
              categories={categories}
              contentTypes={contentTypes}
              filters={filters}
              setFilters={setFilters}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
