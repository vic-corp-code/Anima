# Human Testing Roadmap

Discovered issues from early hands-on testing, tracked here until resolved.

## Resolved

- [x] **AI form for adding animals** — Conversational AI agent fully wired (create/approve flow, FR/ES). Backend now supports full CRUD via 27 agent tools. Done 2026-07-30.
- [x] **Invitation should generate a new user** — Invite `accept` mutation creates a new user if one doesn't exist; Clerk signup handles the rest.
- [x] **Announcements: no button to add** — Added "Create Draft" CTA on main announcements list page + animal picker at `/announcements/new`. Done 2026-07-30.
- [x] **Navigation UX** — Persistent sidebar (desktop) + bottom tab bar (mobile) within org workspace, active state highlighting. Done 2026-07-30.
- [x] **Animal identification: "ID not ready" UX** — Amber badge ("ID en attente" / "ID pendiente") on animal list cards + warning banner on detail page. Done 2026-07-30.
- [x] **AI agent: expose new CRUD tools in UI** — Generic `OrgChat` component handles all 27 tools, floating chat FAB accessible from any org page, approval UI works for all tool types. Done 2026-07-30.

## Open


-PAUSED UNTIL NEEDED ] email invitation should drive to a creation of a new user form. the status of that user should be fixed by the type of invitation they receive. once the user accepts and creates its user, it should be added to the org that send the invitation 
- 


<!--*All original human testing items are resolved. New items will be added here after the next round of hands-on testing.*-->
