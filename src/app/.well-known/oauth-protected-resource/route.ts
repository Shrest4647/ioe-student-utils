import { protectedResourceHandler } from "mcp-handler";
import { appEnv } from "@/env";

const handler = protectedResourceHandler({
  authServerUrls: [appEnv.NEXT_PUBLIC_BASE_URL],
  resourceUrl: `${appEnv.NEXT_PUBLIC_BASE_URL}/api/mcp/mcp`,
});

export { handler as GET, handler as OPTIONS };
