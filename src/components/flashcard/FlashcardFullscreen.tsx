"use client";

import { ChevronLeft, ChevronRight, Edit, Share2, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardFullscreenProps } from "@/types/flashcard";
import { Flashcard } from "./Flashcard";

export const FlashcardFullscreen: React.FC<FlashcardFullscreenProps> = ({
  cards,
  title: _title,
  isOpen,
  onClose,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Sync index with prop
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Reset flip state when card changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: need to reset flip state when index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
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
    [isOpen, onClose, handlePrev, handleNext, handleFlip],
  );

  // Keyboard navigation
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const progress = ((currentIndex + 1) / cards.length) * 100;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${isOpen ? "opacity-100" : "opacity-0"}
      `}
      style={{
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-gray-100/98 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative flex h-full flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 md:px-8">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-200"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5 text-gray-700" />
          </Button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-lg px-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200"
              aria-label="Share flashcards"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-lg px-3 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200"
              aria-label="Edit flashcards"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-4 md:px-8">
          {/* Card Container - Carousel Style */}
          <div
            className={`h-[50vh] w-full max-w-4xl transition-all duration-300 ease-out md:h-[60vh] ${isOpen ? "scale-100" : "scale-95"}
            `}
            style={{
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="relative h-full overflow-hidden">
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
                    className="h-full w-full shrink-0 px-4"
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
          </div>

          {/* Control Bar */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              {/* Previous Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                disabled={currentIndex === 0 || isAnimating}
                className="h-9 w-9 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                aria-label="Previous card"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Progress Bar */}
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200 md:w-64">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-300 ease-out"
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
                className="h-9 w-9 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                aria-label="Next card"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </Button>

              {/* Counter */}
              <div className="ml-2 min-w-12 text-right font-medium text-gray-600 text-sm">
                {currentIndex + 1}/{cards.length}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FlashcardFullscreen;
