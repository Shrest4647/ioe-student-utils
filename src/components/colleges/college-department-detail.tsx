"use client";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { DepartmentDetail } from "@/components/departments/department-detail";
import { useAuth } from "@/hooks/use-auth";
import { useCollegeDepartment } from "@/hooks/use-content";

export function CollegeDepartmentDetail() {
  const { slug: collegeSlug, departmentSlug } = useParams();

  const { user } = useAuth();
  const { data: collegeDepartment, isLoading } = useCollegeDepartment(
    collegeSlug as string,
    departmentSlug as string,
  );

  if (!collegeDepartment) {
    return (
      <div className="flex min-h-125 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
        {!isLoading ? (
          <div className="text-center">
            <p className="text-lg text-muted-foreground">
              Department not found
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  const collegeDepartmentData = {
    id: collegeDepartment.department?.id || collegeDepartment.id,
    name: collegeDepartment.department?.name || "",
    slug: collegeDepartment.department?.slug || "",
    description:
      collegeDepartment.description ||
      collegeDepartment.department?.description ||
      "",
    websiteUrl:
      collegeDepartment.websiteUrl ||
      collegeDepartment.department?.websiteUrl ||
      "",
    isActive:
      collegeDepartment.isActive ||
      collegeDepartment.department?.isActive ||
      false,
  };

  return (
    <DepartmentDetail
      department={collegeDepartmentData}
      user={user}
      entityType="collegeDepartment"
    />
  );
}
