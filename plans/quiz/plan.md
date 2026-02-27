Below is a **complete style, UX, architecture, and implementation plan** to replicate a modern flashcard-style quiz app inside an existing **Next.js + TypeScript + Tailwind + shadcn/ui** project.

The goal is:

* Fully reusable
* Headless logic (can embed anywhere)
* UI separated from state engine
* Supports MCQ, hint, rationale
* Flashcard-style reveal
* Clean integration API
* Extensible for future features (timed mode, scoring, analytics, API-driven quizzes)

---

# 1. UX & Interaction Model (Flashcard Flow)

### Core Interaction Pattern

Each question behaves like a flashcard:

1. Show question
2. User selects answer
3. Reveal correctness + rationale
4. Optionally show hint
5. “Next” to continue
6. Final score screen

---

## Screen States

### 1️⃣ Initial

* Title
* Question count
* Start button

### 2️⃣ Question Active

* Question text
* Optional hint button
* List of answer choices
* No feedback yet

### 3️⃣ Answered (Reveal State)

* Correct/Incorrect highlighted
* Rationale shown
* Disabled options
* Next button visible

### 4️⃣ Completed

* Score summary
* % score
* Retry button
* Review answers option

---

# 2. Visual Design System

### Design Tone

* Clean
* Modern
* Soft rounded corners
* Subtle animations
* Card-based layout

---

## Layout Structure

```
Centered container
  └── Card
        ├── Header (Quiz title + progress)
        ├── Body
        │     ├── Question
        │     ├── Hint toggle
        │     └── Answer list
        └── Footer
              └── Next / Finish button
```

---

## Tailwind Design Tokens

Use consistent styling:

| Element       | Classes                                      |
| ------------- | -------------------------------------------- |
| Container     | `max-w-2xl mx-auto p-6`                      |
| Card          | `rounded-2xl shadow-lg border bg-background` |
| Question      | `text-xl font-semibold`                      |
| Option        | `rounded-xl border p-4 transition`           |
| Correct       | `bg-green-100 border-green-500`              |
| Incorrect     | `bg-red-100 border-red-500`                  |
| Neutral Hover | `hover:bg-muted`                             |

---

## shadcn Components Used

* `Card`
* `Button`
* `Progress`
* `Badge`
* `Separator`
* `Alert`
* `Accordion` (optional hint)
* `Toast` (optional feedback)
* `ScrollArea` (if long content)

---

# 3. File & Component Architecture

Make it fully reusable and portable.

```
/components/quiz/
    QuizProvider.tsx
    QuizContainer.tsx
    QuizCard.tsx
    QuizQuestion.tsx
    QuizOptions.tsx
    QuizOption.tsx
    QuizFooter.tsx
    QuizProgress.tsx
    QuizResult.tsx
    useQuiz.ts
    types.ts
```

---

# 4. TypeScript Data Models

### types.ts

```ts
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
  selectedIndex: number
  isCorrect: boolean
}
```

---

# 5. State Engine (Headless Logic)

## useQuiz.ts (Core Engine)

This hook manages:

* Current question index
* Selected answer
* Score
* Progress
* Completed state

```ts
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

---

# 6. Core UI Components

---

## QuizContainer.tsx

Handles layout + switching states.

```tsx
import { QuizData } from "./types"
import { useQuiz } from "./useQuiz"
import { QuizCard } from "./QuizCard"
import { QuizResult } from "./QuizResult"

interface Props {
  data: QuizData
}

export function QuizContainer({ data }: Props) {
  const quiz = useQuiz(data)

  if (quiz.isComplete) {
    return <QuizResult score={quiz.score} total={quiz.total} />
  }

  return <QuizCard quiz={quiz} title={data.title} />
}
```

---

## QuizCard.tsx

```tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { QuizQuestion } from "./QuizQuestion"
import { QuizFooter } from "./QuizFooter"
import { QuizProgress } from "./QuizProgress"

export function QuizCard({ quiz, title }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <h2 className="text-lg font-semibold">{title}</h2>
          <QuizProgress progress={quiz.progress} />
        </CardHeader>

        <CardContent className="space-y-6">
          <QuizQuestion quiz={quiz} />
          <QuizFooter quiz={quiz} />
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## QuizQuestion.tsx

```tsx
import { Button } from "@/components/ui/button"

export function QuizQuestion({ quiz }) {
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

---

## QuizFooter.tsx

```tsx
import { Button } from "@/components/ui/button"

export function QuizFooter({ quiz }) {
  if (quiz.selectedIndex === null) return null

  return (
    <div className="flex justify-end">
      <Button onClick={quiz.nextQuestion}>
        Next
      </Button>
    </div>
  )
}
```

---

## QuizResult.tsx

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuizResult({ score, total }) {
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
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

# 7. Integration in Any Next.js App

### Example Page

```tsx
import quizData from "@/data/yoloz-quiz.json"
import { QuizContainer } from "@/components/quiz/QuizContainer"

export default function QuizPage() {
  return <QuizContainer data={quizData} />
}
```

---

# 8. Reusability Strategy

To make this portable:

* No routing dependency
* No global state
* No API assumptions
* Pure props-based
* Types exported
* Hook-based logic

---

# 9. Optional Advanced Features

You can extend with:

### 🔹 Timed Mode

Add countdown in useQuiz.

### 🔹 Review Mode

Store answers and show question-by-question review screen.

### 🔹 Shuffle Questions

Shuffle data before passing to hook.

### 🔹 Animations

Add:

* `framer-motion`
* Fade/slide between questions

### 🔹 Theming

Use Tailwind + shadcn CSS variables for:

* Dark mode
* Brand customization

---

# 10. Accessibility

* Use `<button>` not div
* Use `aria-disabled`
* Keyboard navigation
* Focus ring styling
* Semantic heading hierarchy

---

# 11. Production-Grade Improvements

* Persist progress to localStorage
* Save score to API
* Analytics events
* Server-fetched quizzes
* MDX support for formatted questions
* LaTeX support with `react-katex`

---

# 12. Final Architecture Summary

This implementation:

✅ Fully typed
✅ Headless logic
✅ UI separated
✅ Tailwind styled
✅ shadcn integrated
✅ Reusable in any Next.js app
✅ Supports flashcard reveal behavior
✅ Extensible

---

Further improvements:

* Upgrade this to a production-ready enterprise quiz system architecture
* Add animation system with framer-motion
* Convert this into a publishable npm component library
* Add persistence and API backend plan
