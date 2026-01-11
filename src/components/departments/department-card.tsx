import { Building2, Star } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  createdAt: string | Date | null;
}

interface DepartmentCardProps {
  department: Department;
}

export function DepartmentCard({ department }: DepartmentCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="space-y-1">
          <CardTitle className="line-clamp-1 text-lg">
            <Link
              href={`/departments/${department.slug}`}
              className="decoration-primary underline-offset-4 hover:underline"
            >
              {department.name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs">
            {department.description || "No description available"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-foreground/90">Academic Department</span>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 pt-2">
        <div className="flex w-full items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-medium">Rate This Department</span>
          </div>
          {department.websiteUrl && (
            <a
              href={department.websiteUrl}
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
