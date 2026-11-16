import { protectedResourceHandler } from "mcp-handler";
import { appEnv } from "@/env";

const handler = protectedResourceHandler({
  authServerUrls: [appEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")],
  resourceUrl: `${appEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")}/api/mcp/mcp`,
});

export { handler as GET, handler as OPTIONS };
