"use client";

import { CalendarIcon, PlusIcon, XIcon } from "lucide-react";
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

        // Reset form
        setSubjectName("");
        setTemplateId("");
        setTopics([]);
        setCurrentTopic("");
        setExamDate(undefined);

        // Call onSuccess callback if provided
        onSuccess?.();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Subject Name</Label>
        <Input
          id="subject"
          type="text"
          placeholder="e.g., Physics, Mathematics"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          disabled={isCreating}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="template">Plan Duration</Label>
        <Select
          value={templateId}
          onValueChange={setTemplateId}
          disabled={isCreating}
        >
          <SelectTrigger id="template" className="w-full">
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topics">Topics</Label>
        <div className="flex gap-2">
          <Input
            id="topics"
            type="text"
            placeholder="Add a topic"
            value={currentTopic}
            onChange={(e) => setCurrentTopic(e.target.value)}
            onKeyDown={handleTopicKeyDown}
            disabled={isCreating}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddTopic}
            disabled={!currentTopic.trim() || isCreating}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>

        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                <span>{topic.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemoveTopic(topic.name)}
                  disabled={isCreating}
                  className="h-4 w-4"
                >
                  <XIcon className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Exam Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !examDate && "text-muted-foreground",
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
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={examDate}
              onSelect={(date) => {
                setExamDate(date);
                setIsCalendarOpen(false);
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-destructive text-xs">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!isFormValid}
        size="default"
      >
        {isCreating ? "Creating Plan..." : "Create Study Plan"}
      </Button>
    </form>
  );
}
