"use client";

import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL, GITHUB_REPO_URL } from "@/data";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <section aria-labelledby="cta-heading" className="bg-muted px-4 py-16">
      <div ref={ref} className="mx-auto max-w-4xl text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.h2
            className="mb-4 font-bold text-3xl"
            id="cta-heading"
            variants={itemVariants}
          >
            Ready to take the next step?
          </motion.h2>
          <motion.p
            className="mb-8 text-muted-foreground text-xl"
            variants={itemVariants}
          >
            Join our growing community of students and contributors.
          </motion.p>
          <motion.div
            className="flex flex-col justify-center gap-4 sm:flex-row"
            variants={itemVariants}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                aria-label="Join the IOE Student Utils community"
                className="px-8 text-lg"
                size="lg"
              >
                <Link href={DISCORD_INVITE_URL} target="_blank">
                  Join Community
                </Link>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                aria-label="Contribute to the project on GitHub"
                className="px-8 text-lg"
                size="lg"
                variant="outline"
              >
                <Link href={GITHUB_REPO_URL} target="_blank">
                  Contribute on GitHub
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
