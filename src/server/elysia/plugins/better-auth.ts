import { Elysia } from "elysia";
import { auth } from "@/server/better-auth";

export const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .onError({ as: "global" }, ({ error, request }) => {
    console.error(`Better Auth Error: ${request.method} ${request.url}`, error);
  })
  .mount(auth.handler);
