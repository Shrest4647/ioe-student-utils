"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Calculator, ShieldCheck } from "lucide-react";

export function GPAConverterHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="border-b bg-background px-4 py-4 text-center sm:py-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-3xl"
      >
        <p className="mt-5 font-medium text-primary text-sm">
          TU Grade Converter
        </p>
        <h1 className="mt-3 font-bold text-3xl tracking-tight sm:text-4xl">
          Understand your TU result abroad
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground leading-7 sm:text-lg">
          Compare your percentage, GPA, or CGPA with the grading context used by
          international universities.
        </p>
      </motion.div>
    </section>
  );
}
