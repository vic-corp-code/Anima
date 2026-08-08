import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// The hub is public and unauthenticated (no Clerk) — only locale routing
// needed, unlike apps/shelter's proxy which also composes Clerk.
export default createIntlMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
