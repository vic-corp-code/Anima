# ADR-002: TypeScript end-to-end, Next.js frontends

- **Status:** accepted
- **Date:** 2026-07-07

## Context

Three web apps sharing a domain model, built solo. The developer's working stack is TypeScript; openness was expressed to a different backend language "if better".

## Decision

TypeScript everywhere (strict mode), Next.js (App Router) for all three apps, Tailwind CSS + a shared `packages/ui` design system.

## Rationale

- **One language, shared types end-to-end** is the single biggest productivity lever in a solo monorepo: the Convex schema generates types consumed directly by all frontends — no API contract drift, no codegen pipeline.
- A separate backend language (Go/Python/etc.) was considered and rejected: whatever marginal runtime or ecosystem benefit it offers is outweighed for this project by context-switching cost, duplicated type definitions, and losing Convex (which is TS-native). Nothing in Anima's domain (CRUD, search/filter, image handling, notifications) needs a specialized runtime.
- Next.js: the hub is SEO-critical (SSR/ISR needed), the other apps benefit from the same framework and shared UI. One framework to know deeply beats two known shallowly.
- Tailwind + shared UI package: the three apps must feel like one ecosystem; the compact card formats (announcement, cagnotte, mission) are shared components by design.

## Consequences

- Locked into the React/Next ecosystem — acceptable, it's the ecosystem the developer works in.
- Revisit only if a component genuinely demands another runtime (none foreseen).
