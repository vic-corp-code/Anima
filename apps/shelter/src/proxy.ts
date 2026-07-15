import { clerkMiddleware } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — the exported function
// keeps the same (request) => response shape, so Clerk's and next-intl's
// middleware helpers compose here unchanged.
//
// Route-level auth gatekeeping (createRouteMatcher + auth.protect() here) is
// deprecated by Clerk in favor of resource-based checks — see each
// protected page/layout's own `await auth.protect()` call instead. This
// middleware still needs to run for session/token refresh.
const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((_auth, request) => {
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
