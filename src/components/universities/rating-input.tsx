"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RatingInputProps {
  categoryId: string;
  categories?: Array<{ id: string; name: string; description: string | null }>;
  onSubmit: (
    categoryId: string,
    rating: string,
    title: string,
    review: string,
  ) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ratingLabels: Record<number, string> = {
  1: "Hate it",
  2: "Dislike it",
  3: "It's okay",
  4: "Like it",
  5: "Love it",
};

export function RatingInput({
  categoryId,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RatingInputProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [review, setReview] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>(categoryId);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(selectedCategoryId, rating.toString(), title, review);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="font-semibold text-base">
            Rate this experience
          </Label>
          <p className="text-muted-foreground text-sm">
            Share your opinion about this university
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={isSubmitting}
                className="transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="font-semibold text-primary text-sm">
              {ratingLabels[rating as keyof typeof ratingLabels]}
            </p>
          )}
        </div>
      </div>

      {categories && categories.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={isSubmitting}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`title-${selectedCategoryId}`}>Title (optional)</Label>
        <Input
          id={`title-${selectedCategoryId}`}
          placeholder="Summarize your review"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`review-${selectedCategoryId}`}>
          Review (optional)
        </Label>
        <Textarea
          id={`review-${selectedCategoryId}`}
          placeholder="Tell us more about your experience..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          disabled={isSubmitting}
          rows={4}
          maxLength={1000}
        />
        <p className="text-right text-muted-foreground text-xs">
          {review.length}/1000
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Post Review"}
        </Button>
      </div>
    </div>
  );
}
