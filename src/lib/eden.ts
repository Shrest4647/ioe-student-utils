import { treaty } from "@elysiajs/eden";

import type { App } from "@/app/api/[[...slugs]]/route";
import { appEnv } from "@/env";

export const api = treaty<App>(appEnv.NEXT_PUBLIC_BASE_URL);
