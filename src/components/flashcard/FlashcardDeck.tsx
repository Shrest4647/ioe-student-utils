"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardDeckProps } from "@/types/flashcard";
import { Flashcard } from "./Flashcard";

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  cards,
  title,
  initialIndex = 0,
  onIndexChange,
  onExpand,
  className = "",
  showExpandButton = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset flip state when card changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: need to reset flip state when index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Notify parent of index changes
  useEffect(() => {
    onIndexChange?.(currentIndex);
  }, [currentIndex, onIndexChange]);

  const handlePrev = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;

    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setIsAnimating(false);
    }, 400);
  }, [currentIndex, isAnimating]);

  const handleNext = useCallback(() => {
    if (isAnimating || currentIndex >= cards.length - 1) return;

    setIsAnimating(true);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 400);
  }, [currentIndex, cards.length, isAnimating]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          handlePrev();
          break;
        case "ArrowRight":
          handleNext();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          handleFlip();
          break;
      }
    },
    [handlePrev, handleNext, handleFlip],
  );

  // Keyboard navigation
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!cards || cards.length === 0) {
    return null;
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={`mx-auto w-full max-w-3xl ${className}`}>
      {/* Header */}
      {(title || showExpandButton) && (
        <div className="mb-4 flex items-center justify-between px-2">
          {title && (
            <h3 className="font-semibold text-foreground text-lg">{title}</h3>
          )}
          {showExpandButton && onExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onExpand}
              className="h-9 w-9 rounded-lg hover:bg-muted"
              aria-label="Expand fullscreen"
            >
              <Maximize2 className="h-5 w-5 text-muted-foreground" />
            </Button>
          )}
        </div>
      )}

      {/* Card Container - Carousel Style */}
      <div className="relative mb-6 h-100 overflow-hidden md:h-125">
        {/* Cards Track */}
        <div
          className="absolute inset-0 flex transition-transform duration-400 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="h-full w-full shrink-0 px-2"
              style={{ flex: "0 0 100%" }}
            >
              <Flashcard
                front={card.front}
                back={card.back}
                isFlipped={index === currentIndex ? isFlipped : false}
                onFlip={index === currentIndex ? handleFlip : () => {}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-muted bg-background px-4 py-3 shadow-sm">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isAnimating}
            className="h-9 w-9 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Progress Bar */}
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted md:w-48">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1 || isAnimating}
            className="h-9 w-9 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
            aria-label="Next card"
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Counter */}
          <div className="ml-2 min-w-12 text-right font-medium text-muted-foreground text-sm">
            {currentIndex + 1}/{cards.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardDeck;
