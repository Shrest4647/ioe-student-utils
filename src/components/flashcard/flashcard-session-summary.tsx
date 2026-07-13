import { CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface FlashcardSessionSummaryProps {
  cardsStudied: number;
  accuracyPercentage: number;
  deckSlug?: string;
  canPersistProgress?: boolean;
  onRestart: () => void;
}

export function FlashcardSessionSummary({
  cardsStudied,
  accuracyPercentage,
  deckSlug,
  canPersistProgress,
  onRestart,
}: FlashcardSessionSummaryProps) {
  return (
    <section className="text-center" aria-labelledby="session-complete-title">
      <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-6" />
      </div>
      <p className="mt-5 font-medium text-primary text-sm">Review complete</p>
      <h1
        id="session-complete-title"
        className="mt-1 font-semibold text-2xl tracking-tight"
      >
        Good work. Your schedule is updated.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground text-sm leading-6">
        You answered {cardsStudied} {cardsStudied === 1 ? "card" : "cards"} with{" "}
        {accuracyPercentage}% recall. Difficult cards will return sooner.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button onClick={onRestart}>
          <RotateCcw className="size-4" /> Review another round
        </Button>
        <Button variant="outline" asChild>
          <Link href="/flashcards">Choose another deck</Link>
        </Button>
      </div>

      {!canPersistProgress ? (
        <div className="mx-auto mt-7 max-w-lg rounded-xl bg-muted/50 px-4 py-4 text-sm">
          <p>Your learning history is safe on this device.</p>
          <Button variant="link" className="mt-1 h-auto p-0" asChild>
            <Link
              href={`/auth/signin?callbackURL=/flashcards/${deckSlug ?? ""}`}
            >
              Sign in to migrate it and sync across devices
            </Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
