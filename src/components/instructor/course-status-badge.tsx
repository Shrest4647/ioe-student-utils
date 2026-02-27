import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CourseStatus = "published" | "draft" | "archived";

interface CourseStatusBadgeProps {
  status: CourseStatus;
  className?: string;
}

const statusConfig = {
  published: {
    label: "Published",
    variant: "default" as const,
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  draft: {
    label: "Draft",
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  },
  archived: {
    label: "Archived",
    variant: "outline" as const,
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  },
};

export function CourseStatusBadge({
  status,
  className,
}: CourseStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
