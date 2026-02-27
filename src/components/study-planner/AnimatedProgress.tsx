"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  progress: number;
  className?: string;
  barClassName?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  shimmer?: boolean;
}

export function AnimatedProgress({
  progress,
  className,
  barClassName,
  showPercentage = false,
  size = "md",
  animated = true,
  shimmer = false,
}: AnimatedProgressProps) {
  const sizeClasses = {
    sm: "h-1 sm:h-1.5",
    md: "h-2 sm:h-2.5",
    lg: "h-3 sm:h-4",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-secondary",
          sizeClasses[size],
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full bg-primary",
            animated && "transition-all duration-500",
            barClassName,
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          transition={{
            duration: animated ? 0.6 : 0,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />

        {/* Shimmer effect */}
        {shimmer && progress < 100 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </div>

      {showPercentage && (
        <motion.div
          className="mt-1 flex justify-between text-muted-foreground text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span>Progress</span>
          <motion.span
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {Math.round(progress)}%
          </motion.span>
        </motion.div>
      )}
    </div>
  );
}

// Circular progress variant
interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}

export function CircularProgress({
  progress,
  size = 60,
  strokeWidth = 4,
  className,
  showPercentage = true,
}: CircularProgressProps) {
  // Responsive size adjustments
  const responsiveSize =
    typeof window !== "undefined" && window.innerWidth < 640
      ? Math.max(size * 0.75, 40)
      : size;
  const responsiveStrokeWidth =
    typeof window !== "undefined" && window.innerWidth < 640
      ? Math.max(strokeWidth * 0.75, 3)
      : strokeWidth;

  const responsiveRadius = (responsiveSize - responsiveStrokeWidth) / 2;
  const responsiveCircumference = responsiveRadius * 2 * Math.PI;
  const responsiveOffset =
    responsiveCircumference - (progress / 100) * responsiveCircumference;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <svg
        width={responsiveSize}
        height={responsiveSize}
        className="-rotate-90 transform"
        role="img"
        aria-label={`Progress: ${Math.round(progress)}%`}
      >
        {/* Background circle */}
        <circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={responsiveRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={responsiveStrokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <motion.circle
          cx={responsiveSize / 2}
          cy={responsiveSize / 2}
          r={responsiveRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={responsiveStrokeWidth}
          strokeLinecap="round"
          className="text-primary"
          initial={{ strokeDashoffset: responsiveCircumference }}
          animate={{ strokeDashoffset: responsiveOffset }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{
            strokeDasharray: responsiveCircumference,
          }}
        />
      </svg>
      {showPercentage && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="font-semibold text-xs sm:text-sm">
            {Math.round(progress)}%
          </span>
        </motion.div>
      )}
    </div>
  );
}
