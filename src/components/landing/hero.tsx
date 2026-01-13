"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import landingImage from "@/assets/images/pulchowk-landing-image.jpg";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE_URL } from "@/data";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.025,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="px-4 py-20 text-center">
      <motion.div
        className="mx-auto max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="mb-6 font-bold text-4xl md:text-6xl"
          id="hero-heading"
          variants={itemVariants}
        >
          Bridging the Gap Between IOE and Global Standards
        </motion.h1>
        <motion.p
          className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl md:text-2xl"
          variants={itemVariants}
        >
          The ultimate open-source toolkit for Institute of Engineering students
          to navigate their academic journey and transition to international
          education.
        </motion.p>
        <motion.div
          className="flex flex-col justify-center gap-4 sm:flex-row"
          variants={itemVariants}
        >
          <Button
            aria-label="Get started with IOE Student Utils"
            className="px-8 text-lg"
            size="lg"
          >
            <Link href={DISCORD_INVITE_URL} target="_blank">
              Join Community
            </Link>
          </Button>
          <Button
            aria-label="View project on GitHub"
            className="px-8 text-lg"
            size="lg"
            variant="outline"
          >
            <Link href="#features">Explore Features </Link>
          </Button>
        </motion.div>

        {/* Hero Image */}
        <motion.div
          className="mt-12 mb-8"
          variants={itemVariants}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <Image
            src={landingImage}
            alt="Landing image showcasing IOE Student Utils features"
            height={400}
            className="mx-auto h-auto max-w-full rounded-lg shadow-lg"
            priority
            width={800}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
