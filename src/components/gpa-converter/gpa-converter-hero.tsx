"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Calculator, ShieldCheck } from "lucide-react";

export function GPAConverterHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b bg-background px-4 py-12 text-center sm:py-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-3xl"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calculator className="size-6" />
        </span>
        <p className="mt-5 font-medium text-primary text-sm">
          TU Grade Converter
        </p>
        <h1 className="mt-3 font-bold text-4xl tracking-tight sm:text-5xl">
          Understand your TU result abroad
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground leading-7 sm:text-lg">
          Compare your percentage, GPA, or CGPA with the grading context used by
          international universities.
        </p>
        <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-muted-foreground text-xs">
          <ShieldCheck className="size-3.5 text-primary" />
          Planning estimate · method and sources included
        </div>
      </motion.div>
    </section>
  );
}
