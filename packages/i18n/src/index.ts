// UI locales only — see docs/tech/decisions/ADR-004-i18n-fr-es.md.
// Locale is detected from the visitor's browser, independent of an account's country.

export const locales = ["fr", "es"] as const;
export type Locale = (typeof locales)[number];

// France is the initial launch market (ADR-004); unsupported browser locales fall back here.
export const defaultLocale: Locale = "fr";
