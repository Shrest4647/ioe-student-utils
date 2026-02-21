# Reusable Quiz Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plan to implement this plan task-by-task.

**Goal:** Build a production-ready, reusable flashcard-style quiz component system with TypeScript, shadcn/ui, and framer-motion animations that can fetch quiz data dynamically from any API endpoint.

**Architecture:** Headless state machine with presentational UI components, fully portable across frameworks, with localStorage persistence and graceful error handling.

**Tech Stack:** Next.js 15+, TypeScript 5+, Tailwind CSS 4+, shadcn/ui components, framer-motion for animations

---

## Task 1: Project Setup and Structure

**Files:**
- Create: `components/quiz/` directory structure
- Create: `components/quiz/types.ts` for data models
- Create: `components/quiz/useQuiz.ts` for core hook
- Create: `components/ui/` directory for shadcn primitives (Card, Button, Progress, Badge, Accordion, Separator, Toast, ScrollArea)

**Step 1: Create base directory structure**

```bash
mkdir -p components/quiz
mkdir -p components/ui
```

**Step 2: Define TypeScript interfaces**

```typescript
// components/quiz/types.ts
export interface AnswerOption {
  text: string
  isCorrect: boolean
  rationale: string
}

export interface Question {
  question: string
  answerOptions: AnswerOption[]
  hint?: string
}

export interface QuizData {
  title: string
  questions: Question[]
}

export interface UserAnswer {
  questionIndex: number
  selectedIndex: number | null
  isCorrect: boolean
}
```

**Verification:** Run `tsc --noEmit components/quiz/types.ts` to verify no type errors.

---

## Task 2: Core State Management Hook

**File:** `components/quiz/useQuiz.ts`

**Step 1: Implement useQuiz hook**

```typescript
import { useState } from "react"
import { QuizData, UserAnswer } from "./types"

export function useQuiz(data: QuizData) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [answers, setAnswers] = useState<UserAnswer[]>([])

  const [isComplete, setIsComplete] = useState(false)

  const currentQuestion = data.questions[currentIndex]

  const selectAnswer = (index: number) => {
    if (selectedIndex !== null) return

    setSelectedIndex(index)

    const isCorrect = currentQuestion.answerOptions[index].isCorrect

    setAnswers(prev => [
      ...prev,
      {
        questionIndex: currentIndex,
        selectedIndex: index,
        isCorrect,
      },
    ])
  }

  const nextQuestion = () => {
    if (currentIndex + 1 < data.questions.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedIndex(null)
    } else {
      setIsComplete(true)
    }
  }

  const score = answers.filter(a => a.isCorrect).length
  const progress = ((currentIndex + 1) / data.questions.length) * 100

  return {
    currentQuestion,
    currentIndex,
    selectedIndex,
    selectAnswer,
    nextQuestion,
    isComplete,
    score,
    progress,
    total: data.questions.length,
  }
}
```

**Step 2: Add localStorage persistence**

```typescript
// Add to useQuiz:
const STORAGE_KEY = (quizId: string) => `quiz_progress_${quizId}`

const saveProgress = (progress: UserAnswer[]) => {
  localStorage.setItem(STORAGE_KEY(quizId), JSON.stringify(progress))
}

const loadProgress = (quizId: string): UserAnswer[] | null => {
  const stored = localStorage.getItem(STORAGE_KEY(quizId))
  return stored ? JSON.parse(stored) : null
}
```

**Verification:** Create test file `useQuiz.test.ts` verifying state transitions and answer tracking.

---

## Task 3: Build shadcn/ui Primitives

**Step 1: Install and configure shadcn/ui**

```bash
npx shadcn@latest init
# Choose: New York
# TypeScript: Yes
# Tailwind CSS: Yes
# Components: card, button, progress, badge, separator, scroll-area
```

**Step 2: Verify component exports**

Run `ls components/ui/` to confirm all primitives are available.

**Verification:** Test each primitive in isolation with Storybook or simple test page.

---

## Task 4: Implement Quiz Components

**Task 4.1: Create QuizProgress Component**

**File:** `components/quiz/QuizProgress.tsx`

```typescript
import { Progress } from "@/components/ui/progress"
import { CardContent } from "@/components/ui/card"

interface Props {
  progress: number  // 0-100
  total: number
}

export function QuizProgress({ progress, total }: Props) {
  const percentage = Math.round((progress / total) * 100)

  return (
    <CardContent className="flex items-center justify-between p-4">
      <div className="text-sm text-muted-foreground">
        Question {progress + 1} of {total}
      </div>
      <Progress value={progress} max={total} />
    </CardContent>
  )
}
```

**Task 4.2: Create QuizQuestion Component**

**File:** `components/quiz/QuizQuestion.tsx`

```typescript
import { Question as QuestionType } from "./types"
import { Button } from "@/components/ui/button"

interface Props {
  quiz: {
    currentQuestion: QuestionType
    selectedIndex: number | null
    selectAnswer: (index: number) => void
  }
}

export function QuizQuestion({ quiz }: Props) {
  const { currentQuestion, selectedIndex, selectAnswer } = quiz

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        {currentQuestion.question}
      </h3>

      {currentQuestion.hint && (
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Show Hint</summary>
          <p className="mt-2">{currentQuestion.hint}</p>
        </details>
      )}

      <div className="space-y-3">
        {currentQuestion.answerOptions.map((option, index) => {
          const isSelected = selectedIndex === index
          const isCorrect = option.isCorrect

          let stateClasses = "border hover:bg-muted"
          if (selectedIndex !== null) {
            if (isCorrect) {
              stateClasses = "bg-green-100 border-green-500"
            } else if (isSelected) {
              stateClasses = "bg-red-100 border-red-500"
            }
          }

          return (
            <button
              key={index}
              onClick={() => selectAnswer(index)}
              disabled={selectedIndex !== null}
              className={`w-full text-left p-4 rounded-xl border transition ${stateClasses}`}
            >
              {option.text}
              {selectedIndex !== null && isSelected && (
                <p className="text-sm mt-2 text-muted-foreground">
                  {option.rationale}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Task 4.3: Create QuizOptions Component** (integrated above, but can extract if needed)

**Task 4.4: Create QuizFooter Component**

**File:** `components/quiz/QuizFooter.tsx`

```typescript
import { Button } from "@/components/ui/button"

interface Props {
  quiz: {
    isQuestionActive: boolean
    nextQuestion: () => void
  }
}

export function QuizFooter({ quiz }: Props) {
  if (!quiz.isQuestionActive) return null

  return (
    <div className="flex justify-end">
      <Button onClick={quiz.nextQuestion}>Next</Button>
    </div>
  )
}
```

**Task 4.5: Create QuizResult Component**

**File:** `components/quiz/QuizResult.tsx`

```typescript
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Props {
  score: number
  total: number
}

export function QuizResult({ score, total }: Props) {
  const percentage = Math.round((score / total) * 100)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg text-center">
        <CardContent className="space-y-4 p-8">
          <h2 className="text-2xl font-bold">Quiz Complete 🎉</h2>
          <p className="text-lg">
            {score} / {total} correct
          </p>
          <p className="text-muted-foreground">
            {percentage}% Score
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Task 4.6: Create QuizCard Container**

**File:** `components/quiz/QuizCard.tsx`

```typescript
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { QuizQuestion } from "./QuizQuestion"
import { QuizFooter } from "./QuizFooter"
import { QuizProgress } from "./QuizProgress"
import { QuizResult } from "./QuizResult"
import { useQuiz } from "./useQuiz"
import { QuizData } from "./types"

interface Props {
  data: QuizData
}

export function QuizCard({ data }: Props) {
  const quiz = useQuiz(data)

  if (quiz.isComplete) {
    return <QuizResult score={quiz.score} total={quiz.total} />
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <h2 className="text-lg font-semibold">{data.title}</h2>
          <QuizProgress progress={quiz.progress} total={quiz.total} />
        </CardHeader>

        <CardContent className="space-y-6">
          <QuizQuestion quiz={quiz} />
          <QuizFooter quiz={{ isQuestionActive: quiz.selectedIndex !== null, nextQuestion: quiz.nextQuestion }} />
        </CardContent>
      </Card>
    </div>
  )
}
```

**Verification:** Test each component renders with sample data from `yolox-quiz.json`.

---

## Task 5: Data Fetching with API Support

**File:** `components/quiz/useQuizData.ts`

**Step 1: Create data fetching hook**

```typescript
import { useState } from "react"

interface QuizData {
  title: string
  questions: any[]  // Deliberately flexible for API content
}

export function useQuizData(source: string | QuizData) {
  const [data, setData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!source) return

    setLoading(true)
    setError(null)

    // Determine if source is URL or JSON path
    const isUrl = source.startsWith('http')

    fetch(isUrl ? source : source, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const contentType = isUrl
          ? res.headers.get('content-type')
          : 'application/json'

        const text = await res.text()

        // Validate JSON for URLs
        const parsedData = isUrl ? JSON.parse(text) : text

        // Runtime validation
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Invalid quiz format: missing or malformed data')
        }

        setData(parsedData)
      })
      .catch((err: Error) => {
        console.error('Quiz fetch error:', err)
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [source])

  return { data, loading, error, retry: () => fetch(source) }
}
```

**Step 2: Create QuizPage wrapper**

**File:** `app/quiz/page.tsx` (Next.js App Router)

```typescript
"use client"

import { useQuizData } from "@/components/quiz/useQuizData"
import { QuizCard } from "@/components/quiz/QuizCard"
import quizData from "@/assets/yolox-quiz.json"

export default function QuizPage() {
  // Use API URL from env or local fallback
  const quizSource = process.env.NEXT_PUBLIC_QUIZ_API || quizData

  const quiz = useQuizData(quizSource)

  if (quiz.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse rounded-2xl h-64 w-64 bg-muted" />
        <p className="mt-4 text-muted-foreground">Loading quiz...</p>
      </div>
    )
  }

  if (quiz.error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-500 bg-red-50">
          <CardContent className="text-center">
            <h2 className="text-xl font-bold text-red-900">Error Loading Quiz</h2>
            <p className="text-red-700">{quiz.error}</p>
            <button
              onClick={quiz.retry}
              className="mt-4 bg-red-100 hover:bg-red-200"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!quiz.data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-muted-foreground">No quiz data available</p>
      </div>
    )
  }

  return <QuizCard data={quiz.data} />
}
```

**Verification:** Test with both local JSON and remote API URL.

---

## Task 6: Add Framer Motion Animations

**Step 1: Install framer-motion**

```bash
npm install framer-motion
```

**Step 2: Create animated variants**

**File:** `components/ui/motion.tsx`

```typescript
import { motion } from "framer-motion"

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
}

export const slideUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.4, ease: "easeOut" },
}

export const scaleIn = {
  initial: { scale: 0.9 },
  animate: { scale: 1 },
  transition: { duration: 0.2 },
}
```

**Step 3: Apply animations to QuizCard**

Update `components/quiz/QuizCard.tsx`:

```typescript
import { motion } from "framer-motion"

export function QuizCard({ data }: Props) {
  // ... existing hooks ...

  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={fadeIn}
    >
      <div className="max-w-2xl mx-auto p-6">
        <motion.div layout variants={slideUp}>
          <Card className="rounded-2xl shadow-lg">
            {/* Card content with animations */}
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
```

**Step 4: Add loading skeleton animations**

Create `components/quiz/QuizSkeleton.tsx` for shimmer effect during data fetch.

**Verification:** Animations play smoothly at 60fps on desktop and mobile.

---

## Task 7: Testing and Validation

**Task 7.1: Create test suite**

**File:** `components/quiz/__tests__/useQuiz.test.ts`

```typescript
import { renderHook } from "@testing-library/react-hooks"
import { useQuiz } from "../useQuiz"
import { QuizData } from "../types"

const mockQuizData: QuizData = {
  title: "Test Quiz",
  questions: [
    {
      question: "What is 2 + 2?",
      answerOptions: [
        { text: "4", isCorrect: true, rationale: "Correct!" },
        { text: "5", isCorrect: false, rationale: "Try again" },
      ],
    },
  ],
}

describe("useQuiz", () => {
  const { result } = renderHook(() => useQuiz(mockQuizData))

  test("starts with first question", () => {
    expect(result.current.currentQuestion).toEqual(mockQuizData.questions[0])
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.isComplete).toBe(false)
  })

  test("selecting answer works", () => {
    const { result } = renderHook(() => useQuiz(mockQuizData))

    act(() => result.current.selectAnswer(0))

    expect(result.current.selectedIndex).toBe(0)
    expect(result.current.answers).toHaveLength(1)
    expect(result.current.answers[0].isCorrect).toBe(true)
  })

  test("moving to next question", () => {
    const { result } = renderHook(() => useQuiz(mockQuizData))

    act(() => result.current.selectAnswer(0))
    act(() => result.current.nextQuestion())

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.isComplete).toBe(false)
  })

  test("completing quiz", () => {
    const { result } = renderHook(() => useQuiz(mockQuizData))

    // Answer all questions correctly
    for (let i = 0; i < mockQuizData.questions.length; i++) {
      act(() => result.current.selectAnswer(0))
      act(() => result.current.nextQuestion())
    }

    expect(result.current.isComplete).toBe(true)
    expect(result.current.score).toBe(mockQuizData.questions.length)
  })
})
```

**Task 7.2: Visual regression tests**

Create manual test checklist in `docs/testing-checklist.md`:

- [ ] Quiz renders with sample data
- [ ] Progress bar updates correctly
- [ ] Answer selection visual feedback (green/red/grey)
- [ ] Hint toggle expands/collapses
- [ ] localStorage persists across page reloads
- [ ] API fetch shows loading state
- [ ] Error message displays on fetch failure
- [ ] Animations play smoothly
- [ ] Retry button functionality works
- [ ] Final score displays correctly
- [ ] Keyboard navigation (Enter/Arrows) works

**Task 7.3: Accessibility audit**

Run Lighthouse or manual axe-core testing:

```bash
npx @axe-core/cli audit http://localhost:3000/quiz
```

Verify:
- All interactive elements have ARIA labels
- Focus management is correct
- Color contrast meets WCAG AA standards
- Loading states announced to screen readers

**Verification:** All automated and manual tests pass with no critical issues.

---

## Task 8: Documentation and Examples

**Task 8.1: Write README**

**File:** `components/quiz/README.md`

```markdown
# Reusable Quiz Component

A production-ready, flashcard-style quiz component system for Next.js applications.

## Features

- ✅ Headless state management - fully portable
- ✅ Flashcard interaction - question → select → reveal → feedback
- ✅ Dynamic data loading - from API or local JSON
- ✅ localStorage persistence - progress recovery on reload
- ✅ shadcn/ui components - consistent design system
- ✅ Framer Motion animations - smooth transitions
- ✅ TypeScript - full type safety
- ✅ Multi-quiz support - embeddable anywhere
- ✅ Production-grade error handling - graceful failures

## Usage

### Basic Usage

\`\`typescript
import { QuizCard } from "@/components/quiz/QuizCard"

export default function QuizPage() {
  return <QuizCard data="/path/to/quiz.json" />
}
\`\`

### Advanced Usage

\`\`typescript
import { useQuizData } from "@/components/quiz/useQuizData"

export default function QuizPage() {
  const quiz = useQuizData("https://api.example.com/quiz/yolox")

  if (quiz.loading) return <LoadingSpinner />
  if (quiz.error) return <ErrorState error={quiz.error} />

  return <QuizCard data={quiz.data} />
}
\`\`

## Component API

See [API.md](./API.md) for full component documentation.
```

**Task 8.2: Create API documentation**

**File:** `components/quiz/API.md`

Document all props, interfaces, and usage examples for each component.

**Verification:** All examples in README run without errors.

---

## Execution Checklist

Use this checklist to track implementation progress:

- [ ] Task 1: Project Setup and Structure
  - [ ] Create component directories
  - [ ] Define TypeScript interfaces
  - [ ] Verify type checking
- [ ] Task 2: Core State Management Hook
  - [ ] Implement useQuiz hook
  - [ ] Add localStorage helpers
  - [ ] Test state transitions
  - [ ] Task 3: Build shadcn/ui Primitives
  - [ ] Initialize shadcn/ui
  - [ ] Verify component exports
  - [ ] Task 4: Implement Quiz Components
  - [ ] Create QuizProgress
  - [ ] Create QuizQuestion
  - [ ] Create QuizFooter
  - [ ] Create QuizResult
  - [ ] Create QuizCard
  - [ ] Test with sample data
  - [ ] Task 5: Data Fetching with API Support
  - [ ] Create useQuizData hook
  - [ ] Create QuizPage wrapper
  - [ ] Test loading states
  - [ ] Test error states
  - [ ] Test fallback behavior
  - [ ] Task 6: Add Framer Motion Animations
  - [ ] Install framer-motion
  - [ ] Create animation variants
  - [ ] Apply to QuizCard
  - [ ] Create QuizSkeleton
  - [ ] Test performance
  - [ ] Task 7: Testing and Validation
  - [ ] Create unit tests
  - [ ] Run test suite
  - [ ] Manual testing checklist
  - [ ] Accessibility audit
  - [ ] Task 8: Documentation and Examples
  - [ ] Write README
  - [ ] Create API documentation
  - [ ] Verify all examples

---

## Notes

**Commit Strategy:**
- Commit after each task completion (atomic changes)
- Use conventional commit messages: `feat: add QuizProgress component`, `test: add useQuiz unit tests`
- Run tests before committing to ensure quality

**Testing Priority:**
- Run tests after each component is built (TDD approach)
- Manual testing after full component assembly
- Fix issues immediately, don't batch for end

**Timeline Estimate:**
- Tasks 1-2: 1-2 hours (setup)
- Tasks 3-4: 3-4 hours (core components)
- Tasks 5-6: 2-3 hours (data fetching)
- Tasks 7-8: 2-3 hours (testing + docs)

**Total: 8-12 hours**

---

**Plan saved to:** `docs/plans/2025-02-12-quiz-component.md`

Ready to proceed with implementation using this plan?