# ADR-005: Cagnottes link out to external payment platforms

- **Status:** accepted (user decision, 2026-07-07)
- **Date:** 2026-07-07

## Context
Victoria- Payments and cagnottes system will be studies and implemented later, after the MVP is launched, i have some ideas for example individual donations, but i also think we could IN TIME create a system that allows to capt money in a general way and get it distributed by need. Way to complex to be defined right now. 

Cagnottes ("we need 5 new cages") are a core feature. Handling donations natively means payment-provider integration, KYC on organizations, fund-flow liability, and country-specific fundraising regulation (FR: appel à la générosité du public; ES: Ley de Fundaciones/donation rules) — a compliance project bigger than the rest of the MVP.

## Decision

Anima **never touches money** in v1. A cagnotte stores a **link to an external platform** (FR: HelloAsso, Leetchi; ES: Teaming, GoFundMe; open list). Progress shown on Anima is updated manually by the org.

## Rationale

- Removes all payment compliance from the critical path; associations already know and trust these platforms (HelloAsso is free for French assos).
- Anima's value-add in v1 is *visibility and context* (the concrete need, the animals behind it), not payment rails.

## Consequences

- Progress data is manual → may lag; acceptable, and clearly labeled.
- Donation conversion happens off-platform → we only measure click-throughs.
- Later phases may add: HelloAsso API integration for automatic progress (read-only, no fund handling — nice middle step), then possibly native payments (Stripe Connect) **only** with real traction and legal counsel.
