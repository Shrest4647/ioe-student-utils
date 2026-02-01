import type { Variants } from "framer-motion";

/**
 * Animation variants for study planner components
 * These variants respect prefers-reduced-motion for accessibility
 */

// Check for reduced motion preference
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Container variants with staggered children
export const containerVariants: Variants = {
  hidden: { opacity: prefersReducedMotion ? 1 : 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.08,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

// Individual item variants
export const itemVariants: Variants = {
  hidden: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : -20,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.2,
    },
  },
};

// Card hover variants
export const cardHoverVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: prefersReducedMotion ? 1 : 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

// Progress bar variants
export const progressBarVariants: Variants = {
  hidden: { width: 0 },
  visible: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

// Fade in variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.2,
    },
  },
};

// Scale variants for buttons and interactive elements
export const scaleVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: prefersReducedMotion ? 1 : 1.02,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: prefersReducedMotion ? 1 : 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// Slide variants
export const slideVariants: Variants = {
  hidden: {
    opacity: prefersReducedMotion ? 1 : 0,
    x: prefersReducedMotion ? 0 : -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : 20,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
    },
  },
};

// Stagger container for lists
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

// List item variants
export const listItemVariants: Variants = {
  hidden: {
    opacity: prefersReducedMotion ? 1 : 0,
    y: prefersReducedMotion ? 0 : 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.3,
    },
  },
  exit: {
    opacity: 0,
    x: prefersReducedMotion ? 0 : -20,
    transition: {
      duration: prefersReducedMotion ? 0 : 0.2,
    },
  },
};

// Success/checkmark animation variants
export const successVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// Pop animation for badges and small elements
export const popVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

// Shimmer animation for loading states
export const shimmerVariants: Variants = {
  animate: {
    x: ["-100%", "100%"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};
