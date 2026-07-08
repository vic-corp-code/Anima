# ADR-004: French + Spanish from day one

- **Status:** inprogress
- **Date:** 2026-07-07

## Context

Target market decision: France + Spain at launch (user decision, 2026-07-07). i18n retrofits are notoriously expensive; country-specific concepts differ (asso loi 1901 vs. asociación; RNA/SIRET vs. Registro de Asociaciones; HelloAsso vs. Teaming).

## Decision

Victoria- This needs still reflection about the strategy to take. 


1. **UI fully localized in FR and ES** from the first shipped screen; message catalogs live in `packages/i18n`; no hardcoded strings, enforced by lint. Library chosen at phase 0 (next-intl is the default candidate for Next.js App Router).
2. **Country is a first-class field** on organizations (and drives verification scheme, org-type vocabulary, suggested cagnotte platforms) — not inferred from language.
3. **User content is not auto-translated.** Orgs write in their language; announcements can optionally carry a second-locale variant. Machine translation is a later, clearly-labeled feature (open question).
4. Docs and code are in English.

## Rationale

- Retrofitting i18n means touching every component; wiring it into the foundation costs days, retrofitting costs weeks.
- Language ≠ country: a Catalan shelter may write in Spanish but live under Spanish registry law; keep the two axes separate in the model.

## Consequences

- Every feature ships with FR + ES strings (translation overhead per feature, accepted).
- Locale-aware formatting (dates, distances) from the start.
- Adding a third locale later should be catalog work only.
