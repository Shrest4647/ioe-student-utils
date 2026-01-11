import { Building2, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface University {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  country: string | null;
  websiteUrl: string | null;
  establishedYear: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface UniversityCardProps {
  university: University;
}

export function UniversityCard({ university }: UniversityCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
            {university.logoUrl ? (
              <Image
                src={university.logoUrl}
                alt={university.name}
                className="h-12 w-12 object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="line-clamp-1 text-lg">
              <Link
                href={`/universities/${university.slug}`}
                className="decoration-primary underline-offset-4 hover:underline"
              >
                {university.name}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2 text-xs">
              {university.description || "No description available"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground/90">
            {university.location || "Location not specified"}
          </span>
          {university.country && (
            <Badge variant="outline" className="ml-auto">
              {university.country}
            </Badge>
          )}
        </div>
        {university.establishedYear && (
          <div className="text-muted-foreground text-xs">
            Established: {university.establishedYear}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This University</span>
          </div>
          {university.websiteUrl && (
            <a
              href={university.websiteUrl}
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
