"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  delay?: number;
  hoverScale?: number;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  title,
  icon,
  delay = 0,
  hoverScale = 1.02,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: hoverScale,
        y: -4,
        transition: { duration: 0.2 },
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={cn(onClick && "cursor-pointer")}
    >
      <Card
        className={cn(
          "transition-shadow duration-300 hover:shadow-lg",
          className,
        )}
      >
        {(title || icon) && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pb-2 sm:px-6">
            {title && (
              <CardTitle className="font-medium text-sm">{title}</CardTitle>
            )}
            {icon && (
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {icon}
              </motion.div>
            )}
          </CardHeader>
        )}
        <CardContent className="px-3 sm:px-6">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// Compact animated card for lists
interface AnimatedListCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  completed?: boolean;
  onClick?: () => void;
}

export function AnimatedListCard({
  children,
  className,
  delay = 0,
  completed = false,
  onClick,
}: AnimatedListCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        scale: 1.01,
        x: 4,
        transition: { duration: 0.2 },
      }}
      whileTap={onClick ? { scale: 0.99 } : undefined}
      layout
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-md",
          completed && "opacity-60",
          onClick && "cursor-pointer",
          className,
        )}
      >
        {/* Completion indicator line */}
        <motion.div
          className="absolute top-0 bottom-0 left-0 w-1 bg-primary"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: completed ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ originY: 0 }}
        />
        <CardContent className="px-3 py-3 sm:px-6 sm:py-4">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
