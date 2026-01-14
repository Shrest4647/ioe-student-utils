"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function Objective() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  const badges = ["Open Source", "Community Driven", "Student Centric"];

  return (
    <section
      aria-labelledby="mission-heading"
      id="mission"
      className="px-4 py-16"
    >
      <div ref={ref} className="mx-auto max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <Card>
            <CardHeader>
              <motion.div variants={itemVariants}>
                <CardTitle
                  className="text-center text-3xl"
                  id="mission-heading"
                >
                  Our Mission
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="text-center">
              <motion.p
                className="mb-8 text-lg text-muted-foreground"
                variants={itemVariants}
              >
                IOE Student Utils is a community-driven ecosystem designed to
                assist students and graduates in their academic journey. We
                provide essential tools and resources to simplify the process of
                applying to universities abroad and meeting international
                academic standards.
              </motion.p>
              <motion.div variants={itemVariants}>
                <Separator aria-hidden="true" className="my-8" />
              </motion.div>
              <motion.div
                className="flex flex-wrap justify-center gap-4"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {badges.map((badge) => (
                  <motion.div
                    key={badge}
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: {
                        opacity: 1,
                        scale: 1,
                        transition: {
                          duration: 0.25,
                          ease: "easeOut" as const,
                        },
                      },
                    }}
                  >
                    <Badge className="px-4 py-2 text-lg" variant="secondary">
                      {badge}
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
