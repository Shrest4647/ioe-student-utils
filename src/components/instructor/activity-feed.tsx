import { Activity, BookOpen, FileEdit, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "created" | "updated" | "deleted" | "viewed";
  entity: "course" | "unit" | "topic";
  entityName: string;
  userName: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  className?: string;
}

const activityIcons = {
  created: Plus,
  updated: FileEdit,
  deleted: Trash2,
  viewed: BookOpen,
};

const activityColors = {
  created: "text-green-600 bg-green-100",
  updated: "text-blue-600 bg-blue-100",
  deleted: "text-red-600 bg-red-100",
  viewed: "text-gray-600 bg-gray-100",
};

const entityLabels = {
  course: "Course",
  unit: "Unit",
  topic: "Topic",
};

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground text-sm">
              No recent activity
            </p>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div
                    className={cn(
                      "shrink-0 rounded-full p-2",
                      activityColors[activity.type],
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>{" "}
                      {activity.type === "created" && "created"}
                      {activity.type === "updated" && "updated"}
                      {activity.type === "deleted" && "deleted"}
                      {activity.type === "viewed" && "viewed"}{" "}
                      <span className="truncate font-medium">
                        {activity.entityName}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        ({entityLabels[activity.entity]})
                      </span>
                    </p>
                    <p className="mt-0.5 text-muted-foreground text-xs">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
