import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso(.*)',
  // Locale-prefixed auth routes
  '/fr/sign-in(.*)',
  '/fr/sign-up(.*)',
  '/fr/sso(.*)',
  '/es/sign-in(.*)',
  '/es/sign-up(.*)',
  '/es/sso(.*)',
]);

const intlMiddleware = createIntlMiddleware(routing);

export default clerkMiddleware((auth, request) => {
  if (isAuthRoute(request)) {
    return;
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};