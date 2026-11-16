import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AgentFeedbackInbox } from "@/components/mcp/agent-feedback-inbox";
import { auth } from "@/server/better-auth";

export default async function AgentFeedbackPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    redirect("/auth/signin?callbackURL=%2Fdashboard%2Fagent-feedback");
  if (session.user.role !== "admin") redirect("/unauthorized");
  return <AgentFeedbackInbox />;
}
