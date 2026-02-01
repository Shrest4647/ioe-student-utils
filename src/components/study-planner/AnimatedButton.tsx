"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AnimatedButton({
  isLoading = false,
  loadingText,
  variant = "default",
  size = "default",
  children,
  className,
  disabled,
  fullWidth = false,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      className={cn("inline-block", fullWidth && "w-full")}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={cn(
          "relative min-h-11 touch-manipulation overflow-hidden transition-all duration-300",
          isLoading && "cursor-wait",
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        <motion.span
          className="flex items-center gap-2"
          animate={{
            opacity: isLoading ? 0.7 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {isLoading && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
            >
              <Loader2 className="size-4 animate-spin" />
            </motion.span>
          )}
          {isLoading && loadingText ? loadingText : children}
        </motion.span>

        {/* Ripple effect on click */}
        {!isLoading && !disabled && (
          <motion.span
            className="pointer-events-none absolute inset-0 bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 2, opacity: [0.5, 0] }}
            transition={{ duration: 0.4 }}
            style={{ borderRadius: "50%", transformOrigin: "center" }}
          />
        )}
      </Button>
    </motion.div>
  );
}
