import { format } from "date-fns";
import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RatingDisplay } from "./rating-display";

export interface Rating {
  id: string;
  userId: string;
  categoryId?: string;
  rating: string;
  review: string | null;
  isVerified: boolean;
  createdAt: string | Date | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  category?: {
    id: string;
    name: string;
    applicationEntityType: string;
  };
}

interface RatingCardProps {
  rating: Rating;
}

export function RatingCard({ rating }: RatingCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              {rating.user.image ? (
                <AvatarImage src={rating.user.image} alt={rating.user.name} />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="font-medium text-base">
                {rating.user.name}
              </CardTitle>
              <CardDescription className="text-xs">
                {rating.createdAt &&
                  format(new Date(rating.createdAt), "MMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
          {rating.isVerified && (
            <Badge variant="secondary" className="text-xs">
              Verified
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <RatingDisplay
            rating={Number(rating.rating)}
            size="sm"
            showCount={false}
          />
          <Badge variant="outline" className="text-xs">
            {rating.category?.name}
          </Badge>
        </div>
      </CardHeader>
      {rating.review && (
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {rating.review}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
