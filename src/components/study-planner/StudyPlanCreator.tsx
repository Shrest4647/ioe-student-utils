"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarIcon,
  CheckCircle2,
  PlusIcon,
  Sparkles,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface Topic {
  name: string;
}

interface StudyPlanCreatorProps {
  onSuccess?: () => void;
}

const templates = [
  { id: "1-day", label: "1-Day Sprint" },
  { id: "3-day", label: "3-Day Boost" },
  { id: "1-week", label: "1-Week Plan" },
  { id: "2-week", label: "2-Week Comprehensive" },
  { id: "1-month", label: "1-Month Plan" },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const topicTagVariants = {
  hidden: { opacity: 0, scale: 0.8, x: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    x: 10,
    transition: {
      duration: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

const successVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
    },
  },
};

export function StudyPlanCreator({ onSuccess }: StudyPlanCreatorProps) {
  const { user } = useAuth();
  const [subjectName, setSubjectName] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");
  const [examDate, setExamDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isFormValid =
    subjectName.trim() !== "" &&
    templateId !== "" &&
    examDate !== undefined &&
    topics.length > 0 &&
    !isCreating;

  const handleAddTopic = () => {
    const trimmedTopic = currentTopic.trim();
    if (trimmedTopic && !topics.some((t) => t.name === trimmedTopic)) {
      setTopics([...topics, { name: trimmedTopic }]);
      setCurrentTopic("");
    }
  };

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTopic();
    }
  };

  const handleRemoveTopic = (topicName: string) => {
    setTopics(topics.filter((t) => t.name !== topicName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !isFormValid) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/study-plans/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          templateId,
          subjectName: subjectName.trim(),
          topics: topics.map((t) => ({ name: t.name })),
          examDate: examDate.toISOString(),
          startDate: new Date().toISOString(),
          endDate: examDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Plan created:", data.plan);

        // Show success animation
        setShowSuccess(true);

        // Reset form after delay
        setTimeout(() => {
          setSubjectName("");
          setTemplateId("");
          setTopics([]);
          setCurrentTopic("");
          setExamDate(undefined);
          setShowSuccess(false);

          // Call onSuccess callback if provided
          onSuccess?.();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(
          errorData.error || "Failed to create study plan. Please try again.",
        );
      }
    } catch (err) {
      console.error("Error creating study plan:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Success animation overlay
  if (showSuccess) {
    return (
      <motion.div
        className="flex min-h-[300px] items-center justify-center px-4 sm:min-h-[400px]"
        variants={successVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="text-center">
          <motion.div
            className="relative mx-auto mb-6 flex size-20 items-center justify-center sm:size-24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full bg-green-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <motion.div
              className="relative flex size-16 items-center justify-center rounded-full bg-green-500 sm:size-20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CheckCircle2 className="size-8 text-white sm:size-10" />
            </motion.div>
          </motion.div>
          <motion.h3
            className="mb-2 font-semibold text-xl sm:text-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Plan Created!
          </motion.h3>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your study plan is ready to go
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Subject Name Field */}
      <motion.div
        className="space-y-2"
        variants={itemVariants}
        animate={{
          scale: focusedField === "subject" ? 1.01 : 1,
          transition: { duration: 0.2 },
        }}
      >
        <Label htmlFor="subject" className="text-sm sm:text-base">
          Subject Name
        </Label>
        <motion.div whileFocus={{ scale: 1.02 }} className="relative">
          <Input
            id="subject"
            type="text"
            placeholder="e.g., Physics, Mathematics"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            onFocus={() => setFocusedField("subject")}
            onBlur={() => setFocusedField(null)}
            disabled={isCreating}
            className={cn(
              "h-11 text-base transition-all duration-300 sm:h-10",
              focusedField === "subject" && "ring-2 ring-primary/50",
            )}
          />
          <AnimatePresence>
            {subjectName && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute top-1/2 right-3 -translate-y-1/2"
              >
                <Sparkles className="size-4 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Template Select Field */}
      <motion.div
        className="space-y-2"
        variants={itemVariants}
        animate={{
          scale: focusedField === "template" ? 1.01 : 1,
          transition: { duration: 0.2 },
        }}
      >
        <Label htmlFor="template" className="text-sm sm:text-base">
          Plan Duration
        </Label>
        <Select
          value={templateId}
          onValueChange={(value) => {
            setTemplateId(value);
            setFocusedField("template");
          }}
          onOpenChange={(open) => !open && setFocusedField(null)}
          disabled={isCreating}
        >
          <SelectTrigger
            id="template"
            className={cn(
              "h-11 w-full text-base transition-all duration-300 sm:h-10",
              focusedField === "template" && "ring-2 ring-primary/50",
              templateId && "border-primary",
            )}
          >
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SelectItem
                  value={template.id}
                  className="py-3 text-sm sm:py-2 sm:text-base"
                >
                  {template.label}
                </SelectItem>
              </motion.div>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Topics Field */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Label htmlFor="topics" className="text-sm sm:text-base">
          Topics
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <motion.div
            className="relative flex-1"
            animate={{
              scale: focusedField === "topics" ? 1.01 : 1,
              transition: { duration: 0.2 },
            }}
          >
            <Input
              id="topics"
              type="text"
              placeholder="Add a topic"
              value={currentTopic}
              onChange={(e) => setCurrentTopic(e.target.value)}
              onKeyDown={handleTopicKeyDown}
              onFocus={() => setFocusedField("topics")}
              onBlur={() => setFocusedField(null)}
              disabled={isCreating}
              className={cn(
                "h-11 text-base transition-all duration-300 sm:h-10",
                focusedField === "topics" && "ring-2 ring-primary/50",
              )}
            />
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto"
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTopic}
              disabled={!currentTopic.trim() || isCreating}
              className="h-11 w-full min-w-[44px] transition-all duration-200 sm:h-10 sm:w-auto"
            >
              <PlusIcon className="size-4 sm:mr-2" />
              <span className="sm:inline">Add</span>
            </Button>
          </motion.div>
        </div>

        <AnimatePresence mode="popLayout">
          {topics.length > 0 && (
            <motion.div
              className="mt-2 flex flex-wrap gap-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {topics.map((topic, index) => (
                <motion.div
                  key={topic.name}
                  variants={topicTagVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="flex min-h-[32px] items-center gap-1 rounded-md bg-secondary px-2.5 py-1.5 text-xs sm:text-sm"
                >
                  <span>{topic.name}</span>
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.8 }}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTopic(topic.name)}
                      disabled={isCreating}
                      className="h-6 min-h-[24px] w-6 min-w-[24px]"
                    >
                      <XIcon className="size-3" />
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Exam Date Field */}
      <motion.div className="space-y-2" variants={itemVariants}>
        <Label className="text-sm sm:text-base">Exam Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-11 w-full justify-start text-left font-normal text-base transition-all duration-300 sm:h-10",
                  !examDate && "text-muted-foreground",
                  examDate && "border-primary ring-1 ring-primary/20",
                )}
                disabled={isCreating}
              >
                <CalendarIcon className="mr-2 size-4" />
                {examDate ? (
                  examDate.toLocaleDateString()
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </motion.div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Calendar
                mode="single"
                selected={examDate}
                onSelect={(date) => {
                  setExamDate(date);
                  setIsCalendarOpen(false);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
                className="rounded-md border"
              />
            </motion.div>
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-xs sm:p-4 sm:text-sm">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.div variants={itemVariants}>
        <motion.div
          whileHover={isFormValid ? { scale: 1.01 } : {}}
          whileTap={isFormValid ? { scale: 0.99 } : {}}
        >
          <Button
            type="submit"
            className="h-12 w-full text-base transition-all duration-300 sm:h-11"
            disabled={!isFormValid}
            size="default"
          >
            <AnimatePresence mode="wait">
              {isCreating ? (
                <motion.span
                  key="creating"
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Spinner className="size-4" />
                  Creating Plan...
                </motion.span>
              ) : (
                <motion.span
                  key="create"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Create Study Plan
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {/* Form Progress Indicator */}
      <motion.div className="pt-2" variants={itemVariants}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <motion.div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:h-1">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{
                  width: `${
                    ((Number(subjectName.length > 0) +
                      Number(templateId !== "") +
                      Number(topics.length > 0) +
                      Number(examDate !== undefined)) /
                      4) *
                    100
                  }%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
          <motion.span
            className="text-muted-foreground text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(
              ((Number(subjectName.length > 0) +
                Number(templateId !== "") +
                Number(topics.length > 0) +
                Number(examDate !== undefined)) /
                4) *
                100,
            )}
            %
          </motion.span>
        </div>
      </motion.div>
    </motion.form>
  );
}
