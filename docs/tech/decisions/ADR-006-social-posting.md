# ADR-006: Social posting = generate & copy first, APIs later

- **Status:** accepted
- **Date:** 2026-07-07

## Context

A core promise of the shelter workspace is "post to socials easily and compactly". The obvious implementation — publish directly via platform APIs — hits reality: the Meta Graph API (Facebook Pages + Instagram) requires a verified business app, App Review with screencasts, and periodically changing permissions; X/TikTok have their own hurdles. That's a multi-week project with ongoing maintenance and review-rejection risk — before any user value is proven.

## Decision

**v1 composer generates, the human posts:** from an animal / news item / cagnotte, produce per-network ready-to-paste text (caption with the right tone/length/hashtags per network) and downloadable rendered images (square post, story format) from the compact card. One-click copy + download.

Direct API publishing (starting with Meta Pages/Instagram, likely via their API or an aggregator) becomes its own later milestone, once the composer proves weekly usage.

## Rationale

Victoria- have in general settings of institution a default socials posting while allowing to override it per animal or news item. 
- 90% of the time saved is in *not writing three versions and not fighting a design tool* — copy-paste of a prepared post costs the manager 30 seconds.
- Zero platform-approval risk in MVP; works for every network including ones with no API.
- Server-side card→image rendering (satori/resvg or similar) is reusable for hub OpenGraph images — double duty.

## Consequences

- No scheduling or auto-posting in v1; no post analytics.
- Must nail the image templates (this is a design task — templates per network format, org logo/colors).
- Revisit trigger: orgs actively using the composer ≥ weekly ask for one-click publish.
