import {
  BookOpen,
  FileText,
  GraduationCap,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  variant?: "default" | "outline" | "secondary";
}

const quickActions: QuickAction[] = [
  {
    label: "Create Course",
    href: "/instructor/courses/new",
    icon: BookOpen,
    description: "Add a new course to the platform",
    variant: "default",
  },
  {
    label: "Add Unit",
    href: "/instructor/units/new",
    icon: GraduationCap,
    description: "Create a new unit for existing courses",
    variant: "outline",
  },
  {
    label: "Add Topic",
    href: "/instructor/topics/new",
    icon: FileText,
    description: "Add topics to organize content",
    variant: "outline",
  },
  {
    label: "AI Assistant",
    href: "/instructor/ai-assist",
    icon: Sparkles,
    description: "Get AI help with course structure",
    variant: "secondary",
  },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                variant={action.variant}
                className="h-auto w-full justify-start px-4 py-3"
              >
                <action.icon className="mr-2 h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="font-normal text-muted-foreground text-xs">
                    {action.description}
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
