import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Session Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          You reviewed <strong>{cardsStudied}</strong> cards with{" "}
          <strong>{accuracyPercentage}%</strong> recall.
        </p>

        {!canPersistProgress ? (
          <p className="rounded-md border border-dashed p-3 text-muted-foreground text-sm">
            You are studying as a guest. Sign in to save SRS progress and review
            history.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onRestart}>Retry</Button>
          <Button variant="outline" asChild>
            <Link href="/flashcards">All Decks</Link>
          </Button>
          {deckSlug ? (
            <Button variant="outline" asChild>
              <Link href={`/flashcards/${deckSlug}`}>Deck Page</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
