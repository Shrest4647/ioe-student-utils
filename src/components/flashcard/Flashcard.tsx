"use client";

import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useRef } from "react";
import type { FlashcardProps } from "@/types/flashcard";
import "katex/dist/katex.min.css";

const sanitizeHtml = (unsafeHtml: string): string => {
  if (typeof window === "undefined") return unsafeHtml;

  const template = document.createElement("template");
  template.innerHTML = unsafeHtml;

  // Remove high-risk elements entirely.
  template.content
    .querySelectorAll("script, style, iframe, object, embed")
    .forEach((node) => {
      node.remove();
    });

  // Remove inline handlers and javascript: URLs.
  template.content.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
      }
      if (
        (name === "href" || name === "src" || name === "xlink:href") &&
        value.startsWith("javascript:")
      ) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return template.innerHTML;
};

// Helper function to render LaTeX math expressions
const renderMath = (text: string): string => {
  if (typeof window === "undefined" || !(window as any).katex) {
    return text;
  }

  const katex = (window as any).katex;
  let rendered = text;

  // Render display math: $$...$$
  rendered = rendered.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return match;
    }
  });

  // Render inline math: $...$
  rendered = rendered.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return match;
    }
  });

  return rendered;
};

export const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  isFlipped,
  onFlip,
  className = "",
  style,
}) => {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Render math when component mounts or content changes
  useEffect(() => {
    if (frontRef.current) {
      frontRef.current.innerHTML = sanitizeHtml(renderMath(front));
    }
    if (backRef.current) {
      backRef.current.innerHTML = sanitizeHtml(renderMath(back));
    }
  }, [front, back]);

  const handleClick = () => {
    onFlip?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFlip?.();
    }
  };

  return (
    <div
      className={`relative h-full w-full ${className}`}
      style={{ perspective: "1000px", ...style }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Show question" : "Show answer"}
      aria-pressed={isFlipped}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          type: "spring",
          stiffness: 170,
          damping: 22,
          mass: 0.85,
        }}
        style={{
          transformStyle: "preserve-3d",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-3xl bg-background p-8 shadow-lg md:p-12"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            ref={frontRef}
            className="text-center font-semibold text-foreground text-xl leading-relaxed md:text-2xl"
          >
            {front}
          </div>
          <div className="absolute bottom-8 font-medium text-primary text-sm">
            Click to check answer
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-3xl bg-background p-8 shadow-lg md:p-12"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            ref={backRef}
            className="text-center font-medium text-lg text-primary leading-relaxed md:text-xl"
          >
            {back}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Flashcard;
