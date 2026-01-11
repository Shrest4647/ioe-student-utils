import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  totalReviews?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({
  rating,
  totalReviews = 0,
  showCount = true,
  size = "md",
}: RatingDisplayProps) {
  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSizes[size]} ${
              star <= rating
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
      {showCount && totalReviews > 0 && (
        <span className={`${textSizes[size]} text-muted-foreground`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}
