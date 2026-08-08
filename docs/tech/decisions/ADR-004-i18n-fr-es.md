# ADR-004: Bilingual FR/ES architecture, France-first launch

- **Status:** accepted (user decision, 2026-07-08)
- **Date:** 2026-07-07

## Context

Target market: France + Spain long-term. i18n retrofits are notoriously expensive; country-specific concepts differ (asso loi 1901 vs. asociación; RNA/SIRET vs. Registro de Asociaciones; HelloAsso vs. Teaming). The open question was never *whether* to build both locales in, but how UI language and account country relate, and whether both countries need to be operational on day one.

## Decision

Two axes, kept deliberately separate:

1. **UI language is visitor-driven, not account-driven.** The site's language (FR or ES) is detected from the visitor's browser/navigation locale (`Accept-Language`) with a manual switcher to override. It has nothing to do with which country an account operates in — a France-based org's public page can be read in Spanish by a Spanish-speaking visitor, and vice versa. Fallback for any other browser locale (en, de, …): **default to French**, since France is the initial launch market. Message catalogs for both `fr` and `es` live in `packages/i18n` from the first shipped screen; no hardcoded strings, enforced by lint. Library chosen at phase 0 (next-intl is the default candidate for Next.js App Router).
2. **Country is a first-class field on organizations and volunteer profiles**, asked at account creation, and drives verification scheme, org-type vocabulary, and suggested cagnotte platforms — never inferred from UI language.
3. **Launch scope: France first.** At signup, the country picker offers France and Spain; **Spain is shown but disabled** ("coming soon") rather than hidden, so the roadmap is visible but no Spanish account can be created yet. This means phase 1 only needs France's verification/org-type logic built and working; Spain's schema slot is reserved but its logic ships later, when the toggle is flipped (see the when-to-enable-Spain decision issue).
4. **User content is not auto-translated.** Orgs write in their language; announcements can optionally carry a second-locale variant. Machine translation is a later, clearly-labeled feature (open question).
5. Docs and code are in English.

## Rationale

- Retrofitting i18n means touching every component; wiring both locale catalogs into the foundation costs days, retrofitting costs weeks — so the UI stays bilingual from day one regardless of launch scope.
- Language ≠ country: a Catalan shelter may write in Spanish but live under Spanish registry law; keeping the two axes separate in the model means enabling Spain later is a data/logic change, not an architecture change.
- Gating Spain at the country picker (rather than not building the field at all) means flipping it on later is a one-line toggle plus building out France-equivalent Spain-specific logic (verification, org types) — not a schema migration.

## Consequences

- Every feature still ships with FR + ES UI strings (translation overhead per feature, accepted) even though only France is operationally live at first.
- Locale-aware formatting (dates, distances) from the start.
- Phase 1 pilot recruitment and org/verification logic can scope to France only (see ROADMAP.md); Spain-specific verification/org-type work is deferred, not skipped.
- Adding a third UI locale later should be catalog work only; enabling Spain as an operating country is a toggle + Spain-specific logic, not a re-architecture.
