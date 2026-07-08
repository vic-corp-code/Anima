import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — the exported function
// keeps the same (request) => response shape, so Clerk's and next-intl's
// middleware helpers compose here unchanged.
const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((_auth, request) => {
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
