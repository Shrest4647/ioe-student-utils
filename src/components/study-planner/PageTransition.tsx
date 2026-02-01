"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  mode?: "fade" | "slide" | "scale";
}

const variants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export function PageTransition({
  children,
  className,
  mode = "fade",
}: PageTransitionProps) {
  const pathname = usePathname();
  const selectedVariant = variants[mode];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={cn("min-h-screen", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Slide transition wrapper for specific sections
interface SlideTransitionProps {
  children: React.ReactNode;
  direction?: "left" | "right" | "up" | "down";
  delay?: number;
  className?: string;
  duration?: number;
}

export function SlideTransition({
  children,
  direction = "up",
  delay = 0,
  className,
  duration = 0.4,
}: SlideTransitionProps) {
  const directionOffset = {
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
  };

  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Fade transition wrapper
interface FadeTransitionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
}

export function FadeTransition({
  children,
  delay = 0,
  className,
  duration = 0.3,
}: FadeTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for lists
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  delayChildren = 0.1,
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Stagger item for use inside StaggerContainer
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

// Responsive container that adjusts padding based on screen size
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({
  children,
  className,
}: ResponsiveContainerProps) {
  return (
    <div className={cn("px-3 py-4 sm:px-4 sm:py-6 lg:px-6", className)}>
      {children}
    </div>
  );
}
