import { Building2, MapPin, Star } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface College {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  location: string | null;
  universityId: string;
  university: {
    id: string;
    name: string;
    slug: string;
  };
  isActive: boolean;
  createdAt: string | Date | null;
}

interface CollegeCardProps {
  college: College;
}

export function CollegeCard({ college }: CollegeCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-lg">
            <Link
              href={`/colleges/${college.slug}`}
              className="decoration-primary underline-offset-4 hover:underline"
            >
              {college.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {college.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Link
            href={`/universities/${college.university.slug}`}
            className="text-foreground/90 decoration-primary underline-offset-4 hover:underline"
          >
            {college.university.name}
          </Link>
        </div>
        {college.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground/90">{college.location}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This College</span>
          </div>
          {college.websiteUrl && (
            <a
              href={college.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground text-xs hover:text-primary"
            >
              Visit Website →
            </a>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
