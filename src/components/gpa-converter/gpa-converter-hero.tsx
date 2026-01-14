"use client";

import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export function GPAConverterHero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-gray-900 via-gray-800 to-indigo-900 py-8 text-white">
      {/* Background decoration */}
      <div
        className="absolute top-0 right-0 h-full w-1/3 bg-primary/10"
        style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
      />
      <div className="absolute -right-24 -bottom-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm"
          >
            <GraduationCap className="mr-2 h-4 w-4" />
            For IOE & TU Students Applying Abroad
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 font-bold text-4xl leading-tight md:text-5xl lg:text-6xl"
          >
            TU to GPA Converter
            <span className="block bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              Calculate Your US GPA
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-gray-300 text-lg md:text-xl"
          >
            Convert your Tribhuvan University percentage grades to US 4.0 GPA
            scale using WES and Scholaro standards — recognized by universities
            worldwide.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
