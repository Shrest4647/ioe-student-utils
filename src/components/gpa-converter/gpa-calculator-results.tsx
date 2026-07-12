"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Info,
  ShieldCheck,
} from "lucide-react";
import type { ConversionResult, SourceFormat } from "@/lib/tu-grade-converter";

interface GPACalculatorResultsProps {
  result: ConversionResult | null;
  requirement: number | null;
  sourceFormat: SourceFormat;
}

function getRequirementStatus(result: ConversionResult, requirement: number) {
  const meets =
    result.comparisonDirection === "lower"
      ? result.numericValue <= requirement
      : result.numericValue >= requirement;

  return {
    meets,
    label: meets
      ? "Likely meets the stated minimum"
      : "Below the stated minimum",
  };
}

export function GPACalculatorResults({
  result,
  requirement,
  sourceFormat,
}: GPACalculatorResultsProps) {
  const reduceMotion = useReducedMotion();

  if (!result) {
    return (
      <aside className="flex min-h-96 flex-col justify-between rounded-xl border bg-card p-7 shadow-sm sm:p-8 lg:sticky lg:top-24">
        <div>
          <p className="font-medium text-primary text-xs">Your estimate</p>
          <p className="mt-6 max-w-xs font-semibold text-2xl leading-tight tracking-tight">
            Your result will appear here
          </p>
          <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-6">
            Enter the result exactly as it appears on your TU transcript, then
            choose a destination.
          </p>
        </div>
        <div className="border-t pt-5 text-muted-foreground text-sm leading-6">
          Nothing is uploaded or saved. The estimate is calculated in your
          browser.
        </div>
      </aside>
    );
  }

  const status =
    requirement === null ? null : getRequirementStatus(result, requirement);

  return (
    <motion.aside
      key={`${result.destination}-${result.value}`}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-7 shadow-sm sm:p-8 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-primary text-xs">Your estimate</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary text-xs">
          <ShieldCheck className="size-3.5 text-primary" />
          {result.confidence}
        </span>
      </div>

      <div className="mt-8 border-b pb-7">
        <div className="flex items-end gap-3">
          <span className="font-bold text-5xl leading-none tracking-tight sm:text-6xl">
            {result.value}
          </span>
          {result.comparisonDirection === "lower" ? (
            <ArrowDown
              className="mb-2 size-5 text-primary"
              aria-label="Lower is better"
            />
          ) : (
            <ArrowUp
              className="mb-2 size-5 text-primary"
              aria-label="Higher is better"
            />
          )}
        </div>
        <p className="mt-3 text-muted-foreground text-sm">{result.scale}</p>
        <p className="mt-5 font-medium text-lg">{result.classification}</p>
      </div>

      {status && (
        <div
          className={`mt-6 border-l-2 py-1 pl-4 ${status.meets ? "border-primary" : "border-destructive"}`}
        >
          <p className="font-medium text-sm">{status.label}</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Based only on the minimum you entered. Admissions decisions use more
            than grades.
          </p>
        </div>
      )}

      <p className="mt-7 text-muted-foreground text-sm leading-6">
        {result.summary}
      </p>

      <details className="group mt-7 border-t pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-sm">
          How this was worked out
          <Info className="size-4 text-muted-foreground transition-transform group-open:rotate-45" />
        </summary>
        <p className="mt-4 text-muted-foreground text-sm leading-6">
          {result.method}
        </p>
      </details>

      <div className="mt-7 rounded-lg bg-muted p-4">
        <p className="font-medium text-muted-foreground text-xs">
          What to do next
        </p>
        <p className="mt-2 text-sm leading-6">{result.nextStep}</p>
      </div>

      <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
        {result.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
          >
            {source.label} <ExternalLink className="size-3" />
          </a>
        ))}
      </div>

      <p className="mt-7 border-t pt-5 text-muted-foreground text-xs leading-5">
        {sourceFormat === "percentage"
          ? "Keep the percentage and division exactly as printed on your TU transcript."
          : `Keep the ${sourceFormat === "cgpa" ? "CGPA" : "GPA"} and grading scale exactly as printed on your TU transcript.`}
      </p>
    </motion.aside>
  );
}
