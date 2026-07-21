import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` — the exported function
// keeps the same (request) => response shape, so Clerk's and next-intl's
// middleware helpers compose here unchanged.

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/sso(.*)']);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((auth, request) => {
  // Skip intl middleware for Clerk authentication routes
  if (isAuthRoute(request)) {
    return;
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
