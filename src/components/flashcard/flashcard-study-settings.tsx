"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import type { FlashcardStudyPreferences } from "@/types/flashcard-platform";

interface FlashcardStudySettingsProps {
  preferences: FlashcardStudyPreferences;
  deckDefaults: { newCardsPerDay: number; maxReviewsPerDay: number };
  onChange: (preferences: FlashcardStudyPreferences) => void;
}

export function FlashcardStudySettings({
  preferences,
  deckDefaults,
  onChange,
}: FlashcardStudySettingsProps) {
  const update = <Key extends keyof FlashcardStudyPreferences>(
    key: Key,
    value: FlashcardStudyPreferences[Key],
  ) => onChange({ ...preferences, [key]: value });

  return (
    <div className="grid gap-x-8 gap-y-5 border-t pt-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="study-mode">Study mode</Label>
        <NativeSelect
          id="study-mode"
          className="w-full"
          value={preferences.studyMode}
          onChange={(event) =>
            update(
              "studyMode",
              event.target.value as FlashcardStudyPreferences["studyMode"],
            )
          }
        >
          <NativeSelectOption value="adaptive">
            Adaptive review
          </NativeSelectOption>
          <NativeSelectOption value="random">
            Random practice
          </NativeSelectOption>
          <NativeSelectOption value="cram">Cram all cards</NativeSelectOption>
        </NativeSelect>
        <p className="text-muted-foreground text-xs">
          Adaptive prioritizes overdue and difficult cards.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="aggressiveness">Scheduling</Label>
        <NativeSelect
          id="aggressiveness"
          className="w-full"
          value={preferences.schedulingAggressiveness}
          onChange={(event) =>
            update(
              "schedulingAggressiveness",
              event.target
                .value as FlashcardStudyPreferences["schedulingAggressiveness"],
            )
          }
        >
          <NativeSelectOption value="relaxed">Relaxed</NativeSelectOption>
          <NativeSelectOption value="balanced">Balanced</NativeSelectOption>
          <NativeSelectOption value="intensive">Intensive</NativeSelectOption>
        </NativeSelect>
        <p className="text-muted-foreground text-xs">
          Intensive aims for higher retention with shorter intervals.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-card-limit">New cards per day</Label>
        <Input
          id="new-card-limit"
          type="number"
          min={1}
          max={200}
          value={preferences.newCardsPerDay ?? deckDefaults.newCardsPerDay}
          onChange={(event) =>
            update("newCardsPerDay", Number(event.target.value) || null)
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="review-limit">Maximum reviews</Label>
        <Input
          id="review-limit"
          type="number"
          min={1}
          max={500}
          value={preferences.maxReviewsPerDay ?? deckDefaults.maxReviewsPerDay}
          onChange={(event) =>
            update("maxReviewsPerDay", Number(event.target.value) || null)
          }
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="confidence-scale">Confidence choices</Label>
          <p className="mt-1 text-muted-foreground text-xs">
            Three simple or four precise ratings.
          </p>
        </div>
        <NativeSelect
          id="confidence-scale"
          value={String(preferences.confidenceScale)}
          onChange={(event) =>
            update("confidenceScale", event.target.value === "3" ? 3 : 4)
          }
        >
          <NativeSelectOption value="3">3 choices</NativeSelectOption>
          <NativeSelectOption value="4">4 choices</NativeSelectOption>
        </NativeSelect>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="show-hints">Hints</Label>
          <p className="mt-1 text-muted-foreground text-xs">
            Offer hints before revealing answers.
          </p>
        </div>
        <Switch
          id="show-hints"
          checked={preferences.showHints}
          onCheckedChange={(checked) => update("showHints", checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="auto-advance">Advance after rating</Label>
          <p className="mt-1 text-muted-foreground text-xs">
            Move straight to the next card after one tap.
          </p>
        </div>
        <Switch
          id="auto-advance"
          checked={preferences.autoAdvance}
          onCheckedChange={(checked) => update("autoAdvance", checked)}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="compact-mode">Compact cards</Label>
          <p className="mt-1 text-muted-foreground text-xs">
            Use less vertical space for short material.
          </p>
        </div>
        <Switch
          id="compact-mode"
          checked={preferences.appearance === "compact"}
          onCheckedChange={(checked) =>
            update("appearance", checked ? "compact" : "comfortable")
          }
        />
      </div>
    </div>
  );
}
