"use client";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { DepartmentDetail } from "@/components/departments/department-detail";
import { useAuth } from "@/hooks/use-auth";
import { useDepartment } from "@/hooks/use-content";

export function CollegeDepartmentDetail() {
  const { departmentSlug } = useParams();

  const { user } = useAuth();
  const { data: department, isLoading } = useDepartment(
    departmentSlug as string,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Department not found</p>
        </div>
      </div>
    );
  }

  return <DepartmentDetail department={department} user={user} />;
}
