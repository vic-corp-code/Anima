# Phase 0 — Foundations & De-risking

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** A running monorepo skeleton with Convex + Clerk wired, i18n foundation laid, and all three validation gates cleared — ready for phase 1 shelter workspace work.

**Architecture:** bun workspaces + Turborepo monorepo with `apps/shelter` (Next.js), `packages/backend` (Convex shared backend), `packages/ui`, `packages/i18n`, `packages/domain`, `packages/config`. Convex serves all apps from one deployment. Clerk handles auth.

**Tech Stack:** bun, Turborepo, TypeScript (strict), Next.js App Router, Convex, Clerk, Tailwind CSS, next-intl

**Duration estimate:** ~2–4 weekends (solo, part-time)

---

## Phase 0 Exit Gate

> A logged-in user creates an organization, sees the UI in FR and ES, on a deployed preview — with all three Convex gates green.

| Gate | Status | What to prove |
|---|---|---|
| **Gate 1: Geo** | ☐ | Convex geospatial component handles radius queries on org locations |
| **Gate 2: SSR/SEO** | ☐ | Next.js server component fetches Convex data and server-renders a page |
| **Gate 3: EU residency** | ☐ | Convex confirmed to offer EU data residency (or mitigated) |

If Gate 1 or 2 fails hard → implement a workaround (department/province buckets for geo; client-side fetch for SSR) and reassess the Convex approach before proceeding.

---

## Task Breakdown

### Track A — Monorepo Scaffold (do first)
### Track B — Convex Schema & Auth
### Track C — i18n Foundation
### Track D — Design Tokens & UI Seed
### Track E — Spike: Geo (Gate 1)
### Track F — Spike: SSR/SEO (Gate 2)
### Track G — EU Residency Check (Gate 3)
### Track H — Repo Hygiene & CLAUDE.md

Tracks A → D are sequential. Tracks E, F, G can run in parallel once Track A is done. Track H is last.

---

## Track A — Monorepo Scaffold

### Task A1: Initialize git repo & bun workspace root

**Objective:** Create the repo with bun workspace config and Turborepo.

**Files:**
- Create: `package.json` (root)
- Create: `turbo.json`
- Create: `.gitignore`

**Step 1: Init git**
```bash
mkdir anima && cd anima
git init
```

**Step 2: Create root package.json**
```json
{
  "name": "anima",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test"
  },
  "packageManager": "bun@1.2.6"
}
```

**Step 3: Create turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": {}
  }
}
```

**Step 4: Create .gitignore**
Include: node_modules, .next, .turbo, dist, .env.local, .env*.local, convex/.generated/

**Step 5: Commit**
```bash
git add -A && git commit -m "chore: initialize monorepo with bun workspaces + turborepo"
```

---

### Task A2: Scaffold apps/shelter (Next.js)

**Objective:** Create the shelter workspace Next.js app with App Router, Tailwind, and TypeScript strict.

**Files:**
- Create: `apps/shelter/package.json`
- Create: `apps/shelter/next.config.ts`
- Create: `apps/shelter/tsconfig.json`
- Create: `apps/shelter/tailwind.config.ts`
- Create: `apps/shelter/src/app/layout.tsx`
- Create: `apps/shelter/src/app/page.tsx`
- Create: `apps/shelter/src/app/globals.css`

**Step 1: Create apps/shelter/package.json**
```json
{
  "name": "@anima/shelter",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 3001",
    "build": "next build",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5.7",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "postcss": "^8"
  }
}
```

**Step 2: Create tsconfig.json** (strict mode, path alias `@/` → `./src`, references `@anima/ui` and `@anima/i18n` once they exist).

**Step 3: Create next.config.ts** — minimal, no transpilePackages needed since bun resolves workspaces natively.

**Step 4: Create Tailwind + PostCSS config** (Tailwind v4 style with `@import "tailwindcss"` in globals.css).

**Step 5: Create layout.tsx and page.tsx** — placeholder "Anima Shelter" heading.

**Step 6: Install deps & verify dev starts**
```bash
cd apps/shelter && bun install
bun run dev   # Should start on :3001, show placeholder page
```

**Step 7: Commit**
```bash
git add -A && git commit -m "feat(shelter): scaffold Next.js app with Tailwind + TS strict"
```

---

### Task A3: Scaffold packages/backend (Convex)

**Objective:** Create the shared Convex backend package.

**Files:**
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/backend/convex/_generated/api.ts` (will be generated, add to .gitignore)
- Create: `packages/backend/src/schema.ts` (placeholder)
- Create: `packages/backend/convex/tsconfig.json`

**Step 1: Create packages/backend/package.json**
```json
{
  "name": "@anima/backend",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "convex dev",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "convex": "^1"
  },
  "devDependencies": {
    "typescript": "^5.7"
  }
}
```

**Step 2: Create placeholder schema.ts**
```typescript
// Placeholder — real schema comes in Track B
import { defineSchema } from "convex/server";

export default defineSchema({});
```

**Step 3: Commit**
```bash
git add -A && git commit -m "feat(backend): scaffold Convex backend package"
```

---

### Task A4: Scaffold shared packages (ui, i18n, domain, config)

**Objective:** Create the four shared packages with minimal structure.

**Files:**
- Create: `packages/ui/package.json`, `packages/ui/tsconfig.json`, `packages/ui/src/index.ts`
- Create: `packages/i18n/package.json`, `packages/i18n/tsconfig.json`, `packages/i18n/src/index.ts`
- Create: `packages/domain/package.json`, `packages/domain/tsconfig.json`, `packages/domain/src/index.ts`
- Create: `packages/config/package.json`, `packages/config/tsconfig.json`
  - `packages/config/eslint-config.ts` (shared eslint — extends next/core-web-vitals + convex rules)
  - `packages/config/tsconfig.base.json` (shared TS strict config referenced by all)

**Step 1:** Create each package with `package.json` (name: `@anima/ui`, `@anima/i18n`, `@anima/domain`, `@anima/config`), tsconfig, and an `src/index.ts` that re-exports nothing yet.

**Step 2:** `packages/config/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  },
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Verify monorepo resolves**
```bash
cd /root && bun install   # From repo root
turbo run typecheck      # Should pass (nothing to check yet)
```

**Step 4: Commit**
```bash
git add -A && git commit -m "chore: scaffold shared packages (ui, i18n, domain, config)"
```

---

### Task A5: Verify bun + Convex + Next.js play well together (mini spike)

**Objective:** Confirm bun doesn't fight the Convex/Next.js toolchain before committing further.

**Step 1:** Wire the shelter app to Convex — install `convex` provider in shelter, add `ConvexProvider` wrapper in layout.tsx with a placeholder `CONVEX_SITE_URL` env var.

**Step 2:** `bun run dev` from root (turbo orchestrates both convex dev + next dev).

**Step 3:** If this fails with bun-specific issues (module resolution, hot reload, file watching), note it and switch to pnpm:
```bash
# If bun fights:
rm -rf node_modules bun.lockb
npm install -g pnpm
pnpm install
# Update root package.json packageManager to "pnpm@x.y.z"
```

**Step 4: Commit (whichever package manager won)**
```bash
git add -A && git commit -m "chore: verify toolchain (bun or pnpm) with convex + next.js"
```

---

## Track B — Convex Schema & Clerk Auth

### Task B1: Define initial Convex schema (organizations, users, memberships)

**Objective:** Create the first schema tables that power the shelter workspace.

**Files:**
- Modify: `packages/backend/convex/schema.ts` (was placeholder)
- Create: `packages/backend/convex/users.ts`
- Create: `packages/backend/convex/organizations.ts`
- Create: `packages/backend/convex/memberships.ts`

**Schema design:**
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),           // Clerk user ID — lookup key
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    country: v.union(v.literal("FR"), v.literal("ES")),  // ADR-004
    // extended later: volunteerProfile, etc.
  }).index("by_clerkId", ["clerkId"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),               // URL-safe identifier, unique
    type: v.union(
      v.literal("spa"),
      v.literal("shelter"),
      v.literal("association"),
      v.literal("informal_group")
    ),
    country: v.union(v.literal("FR"), v.literal("ES")),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    lat: v.optional(v.number()),    // geocoded — Gate 1 spike
    lng: v.optional(v.number()),
    description: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("pending"),
      v.literal("verified")
    ),
    registryNumber: v.optional(v.string()), // RNA/SIRET or ES registry
  })
    .index("by_slug", ["slug"])
    .index("by_country", ["country"]),

  memberships: defineTable({
    userId: v.id("users"),
    orgId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  })
    .index("by_user", ["userId"])
    .index("by_org", ["orgId"]),
});
```

**Convex functions:** Create basic `users/createOrUpdate` (called from Clerk webhook), `organizations/create`, `memberships/create`, `memberships/listByUser`, `memberships/listByOrg`.

**Commit:** `feat(backend): initial schema — users, organizations, memberships`

---

### Task B2: Wire Clerk auth (sync webhook + Convex provider)

**Objective:** Clerk sign-up/sign-in works and syncs user data to Convex on every auth event.

**Files:**
- Create: `packages/backend/convex/http.ts` (Clerk webhook handler)
- Create: `packages/backend/convex/auth.config.ts` (Clerk auth config)
- Modify: `apps/shelter/src/app/layout.tsx` (wrap with Clerk + Convex providers)
- Create: `apps/shelter/.env.local.example`

**Step 1: Clerk setup**
- Create Clerk app in Clerk dashboard (or use existing)
- Get `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- Enable Clerk webhooks → get `CLERK_WEBHOOK_SECRET`
- **Google/Gmail only** for sign-up — other providers (email/password, social logins) will be added later

**Step 2: Implement Clerk webhook in Convex**
```typescript
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { users } from "./users";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify SVIX signature
    // Parse event: user.created, user.updated
    // Upsert into Convex users table
    return new Response(JSON.stringify({ success: true }));
  }),
});

export default http;
```

**Step 3: Convex auth config** — map Clerk user ID to Convex identity in Convex functions:
```typescript
// convex/auth.config.ts
import { convexAuth } from "@convex-dev/auth/clerk";
export const auth = convexAuth();
```

**Step 4: Wrap shelter layout.tsx:**
```tsx
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/clerk";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <ConvexAuthProvider client={convex}>
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      </ConvexAuthProvider>
    </ClerkProvider>
  );
}
```

**Step 5: Create .env.local.example** documenting all required env vars.

**Step 6: Verify** — `bun run dev`, sign in with Clerk, check Convex dashboard shows a `users` row with the correct `clerkId`.

**Commit:** `feat(auth): wire Clerk + Convex — webhook sync and provider setup`

---

### Task B3: Create organization creation flow (end-to-end)

**Objective:** A logged-in user can create an organization and see it listed — the minimum end-to-end flow for the exit gate.

**Files:**
- Create: `packages/backend/convex/organizations.ts` (create, getBySlug, listByUser)
- Create: `apps/shelter/src/app/(dashboard)/page.tsx`
- Create: `apps/shelter/src/app/(dashboard)/organizations/new/page.tsx`
- Create: `apps/shelter/src/components/CreateOrgForm.tsx`

**Step 1:** Write Convex mutation `organizations/create` — validates uniqueness of slug, sets `country` to "FR" (Spain gated in UI later), sets creator as admin.

**Step 2:** Build a minimal form component — name, type (dropdown), country (FR selected, ES disabled with "coming soon" per ADR-004).

**Step 3:** Build a dashboard page listing the user's orgs (from `memberships/listByUser` join).

**Step 4:** Verify — create an org, see it in the list, check Convex dashboard.

**Commit:** `feat(shelter): organization creation flow — end-to-end`

---

## Track C — i18n Foundation

### Task C1: Set up next-intl with FR + ES catalogs

**Objective:** Every UI string in the shelter app comes from a message catalog, with FR as default and ES as second locale.

**Files:**
- Modify: `apps/shelter/package.json` (add `next-intl`)
- Create: `packages/i18n/src/fr.json`
- Create: `packages/i18n/src/es.json`
- Create: `packages/i18n/src/index.ts` (re-exports)
- Modify: `apps/shelter/src/app/layout.tsx` (locale detection + provider)
- Create: `apps/shelter/src/i18n.ts` (next-intl config)
- Create: `apps/shelter/src/middleware.ts` (locale routing)

**Step 1:** Install next-intl in shelter app.

**Step 2:** Create message catalogs with the strings used so far:
```json
// fr.json
{
  "app": { "name": "Anima", "shelter": "Espace refuge" },
  "org": {
    "create": "Créer une organisation",
    "name": "Nom de l'organisation",
    "type": "Type",
    "country": "Pays"
  }
}
```
```json
// es.json
{
  "app": { "name": "Anima", "shelter": "Espacio refugio" },
  "org": {
    "create": "Crear organización",
    "name": "Nombre de la organización",
    "type": "Tipo",
    "country": "País"
  }
}
```

**Step 3:** Wire next-intl in middleware.ts — detect locale from Accept-Language header, default to `fr` (France-first, per ADR-004). URL structure: `/fr/...` and `/es/...`.

**Step 4:** Replace all hardcoded strings in shelter pages/components with `useTranslations()`.

**Step 5:** Verify — switch browser locale to ES → page renders in Spanish. Switch to FR → French.

**Step 6: Add lint rule** against hardcoded strings (eslint plugin or custom rule — can be a basic regex rule initially, refine later).

**Commit:** `feat(i18n): next-intl with FR/ES catalogs, locale detection, lint rule`

---

## Track D — Design Tokens & UI Seed

### Task D1: Create design tokens in packages/ui

**Objective:** A shared design system foundation that all three apps will use. NOT a full component library — just tokens and a few primitives.

**Files:**
- Create: `packages/ui/package.json` (add dependencies: clsx, tailwind-merge)
- Create: `packages/ui/src/tokens.css` (CSS custom properties)
- Create: `packages/ui/src/lib/cn.ts` (className merge utility)
- Create: `packages/ui/src/components/Button.tsx` (one primitive)
- Create: `packages/ui/src/index.ts` (re-exports)

**Design tokens** (CSS custom properties approach, Tailwind v4 friendly):
```css
/* tokens.css */
:root {
  /* Colors — warm, trustworthy, animal-welfare feel */
  --color-cream: #faf7f2;
  --color-surface: #ffffff;
  --color-ink: #2c2825;
  --color-muted: #8a8278;
  --color-border: #e8e2da;
  --color-accent: #c47a4a;      /* terracotta/warm orange */
  --color-accent-hover: #b06838;
  --color-safe: #3a8a5c;         /* green for success/verified */
  --color-warn: #b84233;         /* red for warnings */

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;

  /* Spacing (4px base) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;
}
```

**Step 2:** Create `cn.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3:** Create one Button primitive with variants (primary/accent, secondary, ghost) to prove the pattern works.

**Step 4:** Consume in shelter app — import tokens.css and Button, verify rendering.

**Commit:** `feat(ui): design tokens + cn utility + Button primitive`

---

## Track E — Spike: Geo Queries (Gate 1)

### Task E1: Geocode sample org locations and test radius query

**Objective:** Prove Convex can store lat/lng and perform radius filtering — the top technical risk.

**Prerequisites:** Track A done (Convex running).

**Approach:**
1. Add 5–10 sample organizations with known lat/lng (Paris, Lyon, Toulouse, Madrid, Barcelona).
2. Write a Convex query `organizations/searchNearby` using Convex's geospatial component (`geohash` or `fullTextSearch` approach — check latest Convex docs; they added a geospatial index type).
3. Test: query with center=Paris, radius=100km → returns Paris + possibly Lyon; radius=50km → Paris only.
4. **Fallback if Convex geospatial is insufficient:** precompute French department / Spanish province buckets (postal code → department mapping). This is honestly enough for v1 — shelters filter by "near me" at region granularity, not street-level.

**Files:**
- Create: `packages/backend/convex/organizations.ts` (add `searchNearby` query)
- Create: `packages/backend/convex/seed.ts` (seed script for sample data)

**Verification:**
```bash
# Run in Convex dashboard or via function call
# searchNearby({ lat: 48.8566, lng: 2.3522, radiusKm: 100 })
# Expected: returns orgs within 100km of Paris
```

**Gate decision:**
- ✅ Pass → Convex confirmed for geo. Proceed.
- ❌ Fail (no usable geospatial support) → Implement department/province bucket fallback. This is actually sufficient for v1 — reassess with real usage data.

**Commit:** `spike(geo): radius query test with sample org data — Gate 1`

---

## Track F — Spike: SSR/SEO (Gate 2)

### Task F1: Server-render a page from Convex data

**Objective:** Prove Next.js server components can fetch from Convex and SSR/ISR a page — critical for the hub later.

**Approach:**
1. Create a simple server component that fetches an org list from Convex using `fetchQuery` (server-side Convex client).
2. Use Next.js ISR (`revalidate = 60`) to cache the page.
3. Verify: `curl` the page → HTML contains the org data (not client-rendered). Check `View Page Source`.

**Files:**
- Create: `apps/shelter/src/app/(public)/orgs/page.tsx` (server component)
- Create: `packages/backend/src/server-client.ts` (Convex server client factory)

**Code pattern:**
```tsx
// apps/shelter/src/app/(public)/orgs/page.tsx
import { fetchQuery } from "convex/nextjs/server";
import { api } from "@anima/backend/convex/api";
import { revalidatePath } from "next/cache";

// This runs SERVER-SIDE
export const revalidate = 60; // ISR

export default async function OrgsPage() {
  const orgs = await fetchQuery(api.organizations.listPublic);
  return (
    <ul>
      {orgs.map(org => <li key={org._id}>{org.name} — {org.city}</li>)}
    </ul>
  );
}
```

**Verification:**
```bash
# Start dev, hit the page, view source
curl -s http://localhost:3001/fr/orgs | grep "<li>" 
# Should contain org names in raw HTML, not empty <li></li>
```

**Gate decision:**
- ✅ Pass → Convex SSR pattern confirmed. Proceed.
- ❌ Fail (hydration errors, no SSR support) → Investigate `convex/nextjs/server` docs deeper, use `convex-helpers/server`, or adapt the pattern (client-side fetch with ISR).

**Commit:** `spike(ssr): Convex data in Next.js server component — Gate 2`

---

## Track G — EU Residency Check (Gate 3)

### Task G1: Verify Convex EU data residency

**Objective:** Confirm (or mitigate) that Convex stores data in the EU — an RGPD requirement.

**This is a research task, not code.**

**Step 1:** Check Convex docs for region/data residency options:
- https://docs.convex.dev — search for "region", "data residency", "EU", "GDPR"
- Check if Convex has EU deployment regions or if all data is US

**Step 2:** If Convex has no EU region option:
- Assess risk: is this a blocker for phase 1 with pilot associations, or acceptable for a pre-launch prototype?
- Document the decision in OPEN_QUESTIONS.md or a new ADR
- Possible mitigations: DPA with Convex, explicit consent from pilot orgs, defer to phase 1 before public data

**Step 3:** Also check Clerk's EU data residency posture (ADR-007 mentions this alongside Convex).

**Deliverable:** A brief written assessment in the plan tracker or repo. Gate decision:
- ✅ Convex (and Clerk) confirmed EU-resident → proceed
- ⚠️ No EU region but acceptable for pre-launch with pilot consent → proceed with documented risk
- ❌ No EU region and unacceptable → document risk, get explicit consent from pilot orgs, and reassess before public launch

**Commit:** `docs: EU data residency assessment for Convex + Clerk — Gate 3`

---

## Track H — Repo Hygiene & CLAUDE.md

### Task H1: Set up CI, CLAUDE.md, and repo standards

**Objective:** The repo has linting, typecheck, and a CLAUDE.md so Codex (and any AI tooling) has context.

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `CLAUDE.md` (root — repo context for AI coding assistants)
- Modify: `packages/config/eslint-config.ts` (enforce no-hardcoded-strings rule)

**CI pipeline (GitHub Actions):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      # Tests added later when convex-test is wired
```

**CLAUDE.md** — critical repo context:
```markdown
# Anima — AI Coding Context

## Project
Connected ecosystem for animal welfare (FR/ES). Solo part-time project.
See docs/ for full specs — VISION.md, product specs, ADRs, ROADMAP.md.

## Stack
- bun workspaces + Turborepo monorepo
- TypeScript strict everywhere
- Next.js App Router + Tailwind v4
- Convex (single backend for all apps)
- Clerk (auth)
- next-intl (i18n, FR + ES)

## Conventions
- Code & docs in English; UI strings in FR/ES via packages/i18n
- packages/domain: NO framework imports (Convex, React). Pure TS.
- All UI strings from message catalogs — no hardcoded strings in components.
- Country is FR-first, Spain gated at signup (ADR-004).
- Schema changes happen in packages/backend/convex/schema.ts.

## Key files
- docs/VISION.md — product vision
- docs/product/ — product specs per platform
- docs/tech/architecture.md — assembled architecture
- docs/tech/decisions/ — ADRs (1-7 so far)
- docs/roadmap/ROADMAP.md — phases + exit gates
- OPEN_QUESTIONS.md — deferred decisions

## Testing
- packages/domain: unit tests (bun test)
- Convex functions: convex-test (later)
- Playwright e2e: later (phase 2+)
```

**Commit:** `chore: CI pipeline + CLAUDE.md + repo standards`

---

## Summary Checklist

| Task | Track | Description | Depends on |
|---|---|---|---|
| A1 | A | Git repo + bun workspace + Turborepo root | — |
| A2 | A | Scaffold apps/shelter (Next.js) | A1 |
| A3 | A | Scaffold packages/backend (Convex) | A1 |
| A4 | A | Scaffold shared packages (ui, i18n, domain, config) | A1 |
| A5 | A | Verify bun/Convex/Next.js interop | A2, A3 |
| B1 | B | Convex schema: users, orgs, memberships | A3 |
| B2 | B | Clerk auth: webhook + provider wiring | B1, A2 |
| B3 | B | Org creation flow (end-to-end) | B2, C1 |
| C1 | C | next-intl: FR/ES catalogs + locale routing | A2 |
| D1 | D | Design tokens + Button primitive | A4 |
| E1 | E | **Spike: Geo radius query** — Gate 1 | B1 |
| F1 | F | **Spike: SSR/SEO** — Gate 2 | B1 |
| G1 | G | **Research: EU residency** — Gate 3 | A1 |
| H1 | H | CI + CLAUDE.md + repo hygiene | A5 |

**Parallelism:** E1, F1, G1 can run in parallel once A + B1 are done. D1 can run in parallel with B.

---

## Risks & Open Questions for Phase 0

| Risk | Impact | Mitigation |
|---|---|---|
| bun fights Convex/Next.js toolchain | Medium | A5 mini spike; pnpm fallback documented |
| Convex geospatial insufficient for radius queries | High | E1 spike; department/province buckets are a proven v1 fallback |
| Convex SSR pattern broken for Next.js server components | High | F1 spike; adapt pattern or use client-side fetch + ISR |
| No Convex EU residency | Medium | G1 research; pilot consent as interim mitigation |
| Clerk EU residency unknown | Low | G1 research alongside Convex |

---
