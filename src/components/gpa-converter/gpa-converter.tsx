"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Globe2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  aggregateCourses,
  convertTuGrade,
  type DestinationId,
  destinationOptions,
  type GradeCourse,
  type SourceFormat,
} from "@/lib/tu-grade-converter";
import { GPACalculatorResults } from "./gpa-calculator-results";

interface CourseRow {
  id: string;
  name: string;
  score: string;
  credits: string;
}

const emptyCourse = (id: string): CourseRow => ({
  id,
  name: "",
  score: "",
  credits: "1",
});

export function GPAConverter() {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<"overall" | "courses">("overall");
  const [sourceFormat, setSourceFormat] = useState<SourceFormat>("percentage");
  const [destination, setDestination] = useState<DestinationId>("us-canada");
  const [score, setScore] = useState("");
  const [passMark, setPassMark] = useState("40");
  const [requirement, setRequirement] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([emptyCourse("1")]);

  const calculation = useMemo(() => {
    try {
      let inputScore: number;
      let parsedCourses: GradeCourse[] | undefined;

      if (mode === "overall") {
        if (score.trim() === "") return null;
        inputScore = Number(score);
      } else {
        const completeRows = courses.filter(
          (course) =>
            course.score.trim() !== "" && course.credits.trim() !== "",
        );
        if (completeRows.length === 0) return null;
        parsedCourses = completeRows.map((course, index) => ({
          name: course.name.trim() || `Course ${index + 1}`,
          score: Number(course.score),
          credits: Number(course.credits),
        }));
        for (const course of parsedCourses) {
          const maximum = sourceFormat === "percentage" ? 100 : 4;
          if (
            !Number.isFinite(course.score) ||
            course.score < 0 ||
            course.score > maximum
          ) {
            throw new Error("A course result is outside the valid range.");
          }
        }
        inputScore = aggregateCourses(parsedCourses).score;
      }

      return {
        inputScore,
        result: convertTuGrade({
          score: inputScore,
          sourceFormat,
          destination,
          passMark: Number(passMark),
          courses: parsedCourses,
        }),
      };
    } catch {
      return null;
    }
  }, [courses, destination, mode, passMark, score, sourceFormat]);

  const requirementNumber =
    requirement.trim() === "" || !Number.isFinite(Number(requirement))
      ? null
      : Number(requirement);

  const overallScoreError = (() => {
    if (mode !== "overall" || score.trim() === "") return null;
    const value = Number(score);
    const maximum = sourceFormat === "percentage" ? 100 : 4;
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      return `Enter a value between 0 and ${maximum}.`;
    }
    return null;
  })();

  const updateCourse = (
    id: string,
    field: "name" | "score" | "credits",
    value: string,
  ) => {
    setCourses((current) =>
      current.map((course) =>
        course.id === id ? { ...course, [field]: value } : course,
      ),
    );
  };

  const changeSourceFormat = (format: SourceFormat) => {
    setSourceFormat(format);
    if (format === "cgpa") setMode("overall");
    setScore("");
    setRequirement("");
    setCourses([emptyCourse("1")]);
  };

  const requirementLabel =
    destination === "us-canada"
      ? "Minimum required GPA (optional)"
      : destination === "germany"
        ? "Maximum accepted German grade (optional)"
        : sourceFormat === "percentage"
          ? "Minimum required TU percentage (optional)"
          : `Minimum required TU ${sourceFormat === "cgpa" ? "CGPA" : "GPA"} (optional)`;

  const selectedDestination = destinationOptions.find(
    (option) => option.id === destination,
  );
  const destinationLabels = destinationOptions.map((option) => option.label);
  const sourceMaximum = sourceFormat === "percentage" ? 100 : 4;
  const sourceLabel =
    sourceFormat === "percentage"
      ? "percentage"
      : sourceFormat === "cgpa"
        ? "CGPA"
        : "GPA";

  return (
    <section id="converter" className="scroll-mt-20">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <div className="rounded-xl border bg-card p-5 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 border-b pb-8 sm:flex-row sm:items-end">
            <div>
              <p className="font-medium text-primary text-xs">Step 1 of 2</p>
              <h2 className="mt-1 font-semibold text-2xl tracking-tight">
                Enter your TU result
              </h2>
            </div>
            <div
              className="flex w-fit rounded-lg bg-muted p-1"
              aria-label="Input detail"
            >
              {(["overall", "courses"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  disabled={sourceFormat === "cgpa" && option === "courses"}
                  onClick={() => setMode(option)}
                  className={`min-h-9 rounded-md px-3 font-medium text-xs transition-colors ${
                    mode === option
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  }`}
                >
                  {option === "overall" ? "Overall result" : "Course by course"}
                </button>
              ))}
            </div>
          </div>

          <div className="py-8">
            <fieldset>
              <legend className="font-medium text-sm">
                What is on your transcript?
              </legend>
              <div className="mt-3 grid gap-2 sm:max-w-xl sm:grid-cols-3">
                {(["percentage", "gpa", "cgpa"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    aria-pressed={sourceFormat === format}
                    onClick={() => changeSourceFormat(format)}
                    className={`min-h-12 rounded-lg border px-4 text-left font-medium text-sm transition-colors ${
                      sourceFormat === format
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {format === "percentage"
                      ? "Percentage (%)"
                      : format === "cgpa"
                        ? "TU CGPA (4.0)"
                        : "TU GPA (4.0)"}
                  </button>
                ))}
              </div>
            </fieldset>

            <AnimatePresence mode="wait" initial={false}>
              {mode === "overall" ? (
                <motion.div
                  key="overall"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  className="mt-8"
                >
                  <label
                    htmlFor="overall-score"
                    className="font-medium text-sm"
                  >
                    Your overall {sourceLabel}
                  </label>
                  <div className="relative mt-3 max-w-md">
                    <Input
                      id="overall-score"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max={sourceMaximum}
                      step="0.01"
                      value={score}
                      onChange={(event) => setScore(event.target.value)}
                      aria-invalid={overallScoreError !== null}
                      aria-describedby={
                        overallScoreError ? "overall-score-error" : undefined
                      }
                      placeholder={
                        sourceFormat === "percentage"
                          ? "e.g. 72.4"
                          : sourceFormat === "cgpa"
                            ? "e.g. 3.42"
                            : "e.g. 3.67"
                      }
                      className="h-16 rounded-lg bg-background px-4 pr-16 font-semibold text-2xl md:text-2xl"
                    />
                    <span className="pointer-events-none absolute right-4 bottom-5 text-muted-foreground text-sm">
                      {sourceFormat === "percentage" ? "%" : "/ 4.0"}
                    </span>
                  </div>
                  {overallScoreError && (
                    <p
                      id="overall-score-error"
                      className="mt-2 text-destructive text-xs"
                    >
                      {overallScoreError}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="courses"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  className="mt-8"
                >
                  <div className="grid grid-cols-[1fr_6.5rem_5rem_2rem] gap-2 border-b pb-2 font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.12em]">
                    <span>Course (optional)</span>
                    <span>
                      {sourceFormat === "percentage" ? "Mark %" : "GPA"}
                    </span>
                    <span>Credits</span>
                    <span className="sr-only">Remove</span>
                  </div>
                  <div className="divide-y">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="grid grid-cols-[1fr_6.5rem_5rem_2rem] items-center gap-2 py-3"
                      >
                        <Input
                          aria-label="Course name"
                          value={course.name}
                          onChange={(event) =>
                            updateCourse(course.id, "name", event.target.value)
                          }
                          placeholder="e.g. Mathematics"
                          className="h-10 rounded-none border-0 bg-transparent px-0 focus-visible:ring-0"
                        />
                        <Input
                          aria-label="Course result"
                          type="number"
                          min="0"
                          max={sourceFormat === "percentage" ? "100" : "4"}
                          step="0.01"
                          value={course.score}
                          aria-invalid={
                            course.score.trim() !== "" &&
                            (Number(course.score) < 0 ||
                              Number(course.score) >
                                (sourceFormat === "percentage" ? 100 : 4))
                          }
                          onChange={(event) =>
                            updateCourse(course.id, "score", event.target.value)
                          }
                          className="h-10"
                        />
                        <Input
                          aria-label="Course credits"
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={course.credits}
                          onChange={(event) =>
                            updateCourse(
                              course.id,
                              "credits",
                              event.target.value,
                            )
                          }
                          className="h-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove course"
                          disabled={courses.length === 1}
                          onClick={() =>
                            setCourses((current) =>
                              current.filter((item) => item.id !== course.id),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 min-h-10"
                    onClick={() =>
                      setCourses((current) => [
                        ...current,
                        emptyCourse(crypto.randomUUID()),
                      ])
                    }
                  >
                    <Plus /> Add another course
                  </Button>
                  {calculation && (
                    <p className="mt-4 text-muted-foreground text-sm">
                      Weighted TU result: {calculation.inputScore.toFixed(2)}
                      {sourceFormat === "percentage" ? "%" : " / 4.0"}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {sourceFormat === "percentage" && (
              <div className="mt-8 max-w-md">
                <label htmlFor="pass-mark" className="font-medium text-sm">
                  Lowest passing mark on your transcript
                </label>
                <p className="mt-1 text-muted-foreground text-xs leading-5">
                  TU programmes differ. Use the mark printed in your regulations
                  or transcript.
                </p>
                <Select value={passMark} onValueChange={setPassMark}>
                  <SelectTrigger
                    id="pass-mark"
                    className="mt-3 h-11 w-full sm:w-52"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="45">45%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border-t py-8">
            <p className="font-medium text-primary text-xs">Step 2 of 2</p>
            <h3 className="mt-1 font-semibold text-xl">
              Where are you applying?
            </h3>
            <div className="mt-4">
              <Combobox
                items={destinationLabels}
                value={selectedDestination?.label ?? ""}
                onValueChange={(value) => {
                  const option = destinationOptions.find(
                    (item) => item.label === value,
                  );
                  if (option) {
                    setDestination(option.id);
                    setRequirement("");
                  }
                }}
              >
                <ComboboxInput
                  aria-label="Destination country"
                  className="h-12 w-full"
                  placeholder="Search countries"
                />
                <ComboboxContent>
                  <ComboboxEmpty>No country found.</ComboboxEmpty>
                  <ComboboxList>
                    {(label) => {
                      const option = destinationOptions.find(
                        (item) => item.label === label,
                      );
                      return (
                        <ComboboxItem
                          key={label}
                          value={label}
                          className="py-2.5"
                        >
                          <Globe2 className="text-muted-foreground" />
                          <span className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-[0.7rem] text-muted-foreground">
                              {option?.description}
                            </span>
                          </span>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {selectedDestination && (
                <p className="mt-2 text-muted-foreground text-xs">
                  {selectedDestination.region} ·{" "}
                  {selectedDestination.description}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-8">
            <label htmlFor="requirement" className="font-medium text-sm">
              {requirementLabel}
            </label>
            <p className="mt-1 text-muted-foreground text-xs">
              Add a scholarship or admission cut-off to check your estimate
              against it.
            </p>
            <Input
              id="requirement"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
              placeholder="Leave blank if you are only exploring"
              className="mt-3 h-11 max-w-md"
            />
          </div>
        </div>

        <GPACalculatorResults
          result={calculation?.result ?? null}
          requirement={requirementNumber}
          sourceFormat={sourceFormat}
        />
      </div>
    </section>
  );
}
