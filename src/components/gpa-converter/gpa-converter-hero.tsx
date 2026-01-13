"use client";

import { motion } from "framer-motion";
import { Calculator, GraduationCap, TrendingUp } from "lucide-react";

export function GPAConverterHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 py-12 text-white lg:py-16">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-full w-1/3 bg-blue-600 opacity-10 lg:opacity-20" style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)" }} />
      <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />

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
            <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Calculate Your US GPA
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 text-lg text-gray-300 md:text-xl"
          >
            Convert your Tribhuvan University percentage grades to US 4.0 GPA scale
            using WES and Scholaro standards — recognized by universities worldwide.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-3"
          >
            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
              <Calculator className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
              <h3 className="mb-2 font-semibold">Multiple Standards</h3>
              <p className="text-sm text-gray-300">
                Convert using WES and Scholaro standards
              </p>
            </div>

            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
              <TrendingUp className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
              <h3 className="mb-2 font-semibold">Instant Results</h3>
              <p className="text-sm text-gray-300">
                Get accurate GPA calculations in seconds
              </p>
            </div>

            <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
              <GraduationCap className="mx-auto mb-3 h-8 w-8 text-cyan-400" />
              <h3 className="mb-2 font-semibold">Save & Export</h3>
              <p className="text-sm text-gray-300">
                Save calculations and export to CSV
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
