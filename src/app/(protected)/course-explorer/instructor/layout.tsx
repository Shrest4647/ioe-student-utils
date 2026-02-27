import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InstructorSidebar } from "@/components/instructor/instructor-sidebar";
import { auth } from "@/server/better-auth";

export const metadata: Metadata = {
  title: "Instructor Dashboard | IOE Student Utils",
  description: "Manage courses, units, and topics for IOE Student Utils.",
};

async function getSession() {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });
  return session;
}

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user has admin or instructor role
  const userRole = session.user.role;
  if (userRole !== "admin" && userRole !== "instructor") {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <InstructorSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
