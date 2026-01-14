"use client";

import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface A4PageMockupProps extends HTMLAttributes<HTMLDivElement> {
  showPageBreaks?: boolean;
}

export function A4PageMockup({
  children,
  className,
  showPageBreaks = true,
  style,
  ...props
}: A4PageMockupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // A4 dimensions in pixels at 96 DPI
  // Width: 210mm = 793.7px rounded to 794px
  // Height: 297mm = 1122.5px rounded to 1123px
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = containerWidth / A4_WIDTH;
        setScale(newScale);

        // Update container height to match scaled content
        const scaledHeight = contentRef.current.offsetHeight * newScale;
        containerRef.current.style.height = `${scaledHeight}px`;
      }
    };

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    updateDimensions();

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      style={{ ...style }}
      {...props}
    >
      <div
        ref={contentRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${A4_WIDTH}px`,
          minHeight: `${A4_HEIGHT}px`,
        }}
        className="relative origin-top-left bg-white shadow-xl"
      >
        {/* Visual Page Break Marker (repeated background or overlay) */}
        {showPageBreaks && (
          <div
            className="pointer-events-none absolute inset-0 z-50"
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent ${A4_HEIGHT - 2}px, #94a3b8 ${A4_HEIGHT - 2}px, #94a3b8 ${A4_HEIGHT - 1}px, transparent ${A4_HEIGHT - 1}px)`,
              backgroundSize: `100% ${A4_HEIGHT}px`,
              backgroundRepeat: "repeat-y",
            }}
          />
        )}

        {/* Content Container */}
        <div className="h-full w-full">{children}</div>
      </div>

      {/* 
         Phantom Height: 
         Since the transformed element doesn't push the parent's height naturally in all cases 
         (especially with absolute positioning which we are not strictly using here but scale does weird things),
         we might need to ensure the container is tall enough.
         However, since we are scaling a static flow content, the parent div *will* shrink in height visually 
         but DOM-wise it might trigger scrollbars or gaps differently.
         
         Actually, if we transform smoothy, the parent height will simply be the untransformed height? 
         No, transform doesn't affect flow size. 
         We need a wrapper to reserve the scaled height.
      */}
    </div>
  );
}
