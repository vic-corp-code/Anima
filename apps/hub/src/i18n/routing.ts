import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "@anima/i18n";

// Locale is visitor-driven (browser Accept-Language), independent of account
// country — see docs/tech/decisions/ADR-004-i18n-fr-es.md.
export const routing = defineRouting({
  locales,
  defaultLocale,
});
