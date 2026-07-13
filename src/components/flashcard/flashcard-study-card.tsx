"use client";

import { Eye, RotateCcw } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { FlashcardCardView } from "@/types/flashcard-platform";
import { RichFlashcardContent } from "./rich-flashcard-content";

interface FlashcardStudyCardProps {
  card: FlashcardCardView;
  isRevealed: boolean;
  hintVisible: boolean;
  compact: boolean;
  onReveal: () => void;
  onToggleHint: () => void;
}

const interactiveContentSelector =
  "a, button, audio, video, input, select, textarea, pre, code, [role=button]";

export function FlashcardStudyCard({
  card,
  isRevealed,
  hintVisible,
  compact,
  onReveal,
  onToggleHint,
}: FlashcardStudyCardProps) {
  const pointerStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const side = isRevealed ? "back" : "front";
  const media = card.media?.[side] ?? [];

  return (
    <section
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm ${
        compact ? "min-h-[19rem]" : "min-h-[24rem] sm:min-h-[28rem]"
      }`}
      aria-label={isRevealed ? "Flashcard answer" : "Flashcard prompt"}
      onClick={(event) => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        const target = event.target as HTMLElement;
        if (
          target.closest(interactiveContentSelector) ||
          window.getSelection()?.toString()
        ) {
          return;
        }
        onReveal();
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest(interactiveContentSelector)) {
          pointerStart.current = null;
          return;
        }
        pointerStart.current = event.clientX;
      }}
      onPointerUp={(event) => {
        if (pointerStart.current === null) return;
        const distance = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(distance) > 70) {
          didSwipe.current = true;
          onReveal();
        }
      }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.14em]">
          {isRevealed ? "Answer" : "Prompt"}
        </p>
        {card.hint && !isRevealed ? (
          <Button variant="ghost" size="sm" onClick={onToggleHint}>
            {hintVisible ? "Hide hint" : "Show hint"}
          </Button>
        ) : null}
      </div>

      <div
        className={`flex flex-1 cursor-pointer items-center overflow-y-auto px-5 py-7 text-base leading-7 sm:px-9 ${
          compact ? "sm:py-7" : "sm:py-10 sm:text-lg sm:leading-8"
        }`}
        aria-live="polite"
      >
        <RichFlashcardContent
          content={isRevealed ? card.back : card.front}
          media={media}
        />
      </div>

      {!isRevealed && hintVisible && card.hint ? (
        <div className="border-t bg-muted/40 px-5 py-3 text-sm sm:px-9">
          <span className="font-medium">Hint:</span> {card.hint}
        </div>
      ) : null}

      <div className="border-t p-3 sm:p-4">
        {isRevealed ? (
          <Button variant="ghost" className="w-full" onClick={onReveal}>
            <RotateCcw className="size-4" /> Show question
          </Button>
        ) : (
          <Button className="h-12 w-full text-sm" onClick={onReveal}>
            <Eye className="size-4" /> Show answer
            <kbd className="ml-1 hidden rounded border bg-primary-foreground/10 px-1.5 py-0.5 font-normal text-[10px] sm:inline">
              Space
            </kbd>
          </Button>
        )}
      </div>
    </section>
  );
}
