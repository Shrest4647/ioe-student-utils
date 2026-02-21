"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import type { FlashcardProps } from "@/types/flashcard";
import "katex/dist/katex.min.css";

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
      frontRef.current.innerHTML = renderMath(front);
    }
    if (backRef.current) {
      backRef.current.innerHTML = renderMath(back);
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
      className={`perspective-1000 relative h-full w-full ${className}`}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "Show question" : "Show answer"}
      aria-pressed={isFlipped}
    >
      <div
        className={`transform-style-preserve-3d relative h-full w-full transition-transform duration-600 ease-out ${isFlipped ? "rotate-y-180" : ""}
        `}
        style={{
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Front Face */}
        <div
          className="backface-hidden absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-xl md:p-12"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div
            ref={frontRef}
            className="text-center font-semibold text-gray-900 text-xl leading-relaxed md:text-2xl"
          >
            {front}
          </div>
          <div className="absolute bottom-8 font-medium text-indigo-600 text-sm">
            Click to check the answer
          </div>
        </div>

        {/* Back Face */}
        <div
          className="backface-hidden absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-3xl bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-xl md:p-12"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            ref={backRef}
            className="text-center font-medium text-indigo-600 text-lg leading-relaxed md:text-xl"
          >
            {back}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
