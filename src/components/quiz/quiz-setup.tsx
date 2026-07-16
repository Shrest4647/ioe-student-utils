import { Bookmark, Brain, Clock3, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  QuizFeedbackMode,
  QuizMode,
  QuizStudyProfile,
  QuizView,
} from "@/types/quiz";

interface QuizSetupProps {
  quiz: QuizView;
  profile?: QuizStudyProfile | null;
  hasSavedSession: boolean;
  isStarting: boolean;
  onStart: (mode: QuizMode, feedbackMode: QuizFeedbackMode) => void;
  onResume: () => void;
}

const modes: Array<{
  id: QuizMode;
  label: string;
  description: string;
  icon: typeof Brain;
}> = [
  {
    id: "practice",
    label: "Practice",
    description: "Adaptive order with explanations after each answer.",
    icon: Brain,
  },
  {
    id: "review_incorrect",
    label: "Review missed",
    description: "Focus on questions you answered incorrectly last time.",
    icon: RotateCcw,
  },
  {
    id: "review_bookmarked",
    label: "Bookmarks",
    description: "Study only the questions you saved for later.",
    icon: Bookmark,
  },
  {
    id: "timed",
    label: "Timed quiz",
    description: "A focused run with feedback shown at the end.",
    icon: Clock3,
  },
];

export function QuizSetup({
  quiz,
  profile,
  hasSavedSession,
  isStarting,
  onStart,
  onResume,
}: QuizSetupProps) {
  const [mode, setMode] = useState<QuizMode>("practice");
  const [feedbackMode, setFeedbackMode] = useState<QuizFeedbackMode>("instant");
  const missedCount = Object.values(profile?.questions ?? {}).filter(
    (history) => history.lastCorrect === false,
  ).length;
  const bookmarkCount = profile?.bookmarkedQuestionIds.length ?? 0;

  const availability: Partial<Record<QuizMode, boolean>> = {
    review_incorrect: missedCount > 0,
    review_bookmarked: bookmarkCount > 0,
    timed: Boolean(quiz.timeLimitSeconds),
  };

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get(
      "mode",
    ) as QuizMode | null;
    if (requestedMode && modes.some((item) => item.id === requestedMode)) {
      setMode(requestedMode);
    }
  }, []);

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 max-w-2xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {quiz.difficulty ? (
            <Badge variant="secondary" className="capitalize">
              {quiz.difficulty}
            </Badge>
          ) : null}
          <span className="text-muted-foreground text-sm">
            {quiz.questions.length} questions
          </span>
          {quiz.estimatedMinutes ? (
            <span className="text-muted-foreground text-sm">
              · {quiz.estimatedMinutes} min
            </span>
          ) : null}
        </div>
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          {quiz.title}
        </h1>
        <p className="mt-3 max-w-[68ch] text-muted-foreground leading-relaxed">
          {quiz.description?.trim() ||
            "Build recall with a focused study session and useful explanations."}
        </p>
      </div>

      {hasSavedSession ? (
        <div className="mb-7 flex flex-col gap-4 rounded-xl border bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 text-primary" />
            <div>
              <p className="font-medium">Continue where you stopped</p>
              <p className="text-muted-foreground text-sm">
                Your question order and answers are saved on this device.
              </p>
            </div>
          </div>
          <Button className="min-h-11 sm:min-h-8" onClick={onResume}>
            Resume session
          </Button>
        </div>
      ) : null}

      {profile && profile.completedAttempts > 0 ? (
        <div className="mb-7 flex flex-wrap gap-x-6 gap-y-2 border-y py-4 text-sm">
          <p>
            <span className="font-semibold">{profile.overallAccuracy}%</span>{" "}
            <span className="text-muted-foreground">overall accuracy</span>
          </p>
          <p>
            <span className="font-semibold">{missedCount}</span>{" "}
            <span className="text-muted-foreground">questions to revisit</span>
          </p>
          <p>
            <span className="font-semibold">{profile.completedAttempts}</span>{" "}
            <span className="text-muted-foreground">completed sessions</span>
          </p>
        </div>
      ) : null}

      <fieldset>
        <legend className="mb-3 font-medium text-sm">
          Choose a study mode
        </legend>
        <div className="divide-y overflow-hidden rounded-xl border">
          {modes.map((item) => {
            const Icon = item.icon;
            const isAvailable = availability[item.id] ?? true;
            const count =
              item.id === "review_incorrect"
                ? missedCount
                : item.id === "review_bookmarked"
                  ? bookmarkCount
                  : null;
            return (
              <label
                key={item.id}
                className={cn(
                  "flex min-h-20 cursor-pointer items-start gap-3 px-4 py-4 transition-colors hover:bg-muted/50",
                  mode === item.id && "bg-primary/5",
                  !isAvailable && "cursor-not-allowed opacity-45",
                )}
              >
                <input
                  type="radio"
                  name="quiz-mode"
                  value={item.id}
                  checked={mode === item.id}
                  disabled={!isAvailable}
                  onChange={() => {
                    setMode(item.id);
                    if (item.id === "timed") setFeedbackMode("end");
                  }}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground",
                    mode === item.id && "bg-primary text-primary-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-medium">
                    {item.label}
                    {count !== null ? (
                      <span className="text-muted-foreground text-xs">
                        {count}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground text-sm">
                    {item.description}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-2 size-4 rounded-full border",
                    mode === item.id &&
                      "border-[5px] border-primary bg-background",
                  )}
                />
              </label>
            );
          })}
        </div>
      </fieldset>

      {mode !== "timed" ? (
        <fieldset className="mt-6">
          <legend className="mb-3 font-medium text-sm">Show answers</legend>
          <div className="inline-flex rounded-lg bg-muted p-1">
            {(["instant", "end"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFeedbackMode(value)}
                className={cn(
                  "min-h-9 rounded-md px-3 font-medium text-sm transition-colors",
                  feedbackMode === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "instant" ? "After each question" : "At the end"}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-8 flex items-center justify-between border-t pt-5">
        <p className="hidden text-muted-foreground text-xs sm:block">
          Questions and choices are reshuffled every session.
        </p>
        <Button
          size="lg"
          className="min-h-11 w-full px-5 text-sm sm:w-auto"
          disabled={isStarting}
          onClick={() => onStart(mode, feedbackMode)}
        >
          {isStarting ? "Preparing session…" : "Start studying"}
        </Button>
      </div>
    </section>
  );
}
