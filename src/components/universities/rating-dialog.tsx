"use client";

import { useForm } from "@tanstack/react-form";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const ratingLabels: Record<number, string> = {
  1: "Hate it",
  2: "Dislike it",
  3: "It's okay",
  4: "Like it",
  5: "Love it",
};

export interface RatingCategory {
  id: string;
  name: string;
  description: string | null;
}

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  categories: RatingCategory[];
  onSubmit: (data: {
    categoryId: string;
    rating: string;
    title: string;
    review: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function RatingDialog({
  open,
  onOpenChange,
  entityName,
  categories,
  onSubmit,
  isSubmitting = false,
}: RatingDialogProps) {
  const form = useForm({
    defaultValues: {
      rating: "",
      categoryId: categories[0]?.id || "",
      title: "",
      review: "",
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      form.reset();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rate {entityName}</DialogTitle>
          <DialogDescription>
            Share your experience to help others make informed decisions
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field
            name="categoryId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Please select a category" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Category</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="rating"
            validators={{
              onChange: ({ value }) =>
                !value ? "Please select a rating" : undefined,
            }}
          >
            {(field) => {
              const ratingValue = Number(field.state.value);
              return (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Rate this experience</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        disabled={isSubmitting}
                        className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => field.handleChange(String(star))}
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= ratingValue
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {ratingValue > 0 && (
                    <p className="font-semibold text-primary text-sm">
                      {ratingLabels[ratingValue as keyof typeof ratingLabels]}
                    </p>
                  )}
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>

          <form.Field
            name="title"
            validators={{
              onChange: ({ value }) =>
                value.length > 100
                  ? "Title must be less than 100 characters"
                  : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Title (optional)</Label>
                <Input
                  id={field.name}
                  placeholder="Summarize your review"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={100}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="review"
            validators={{
              onChange: ({ value }) =>
                value.length > 1000
                  ? "Review must be less than 1000 characters"
                  : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Review (optional)</Label>
                <Textarea
                  id={field.name}
                  placeholder="Tell us more about your experience..."
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-right text-muted-foreground text-xs">
                  {field.state.value.length}/1000
                </p>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {String(field.state.meta.errors[0])}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isFormSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isFormSubmitting}
                >
                  {isSubmitting || isFormSubmitting
                    ? "Submitting..."
                    : "Post Review"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
