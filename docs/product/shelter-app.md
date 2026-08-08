# Product Spec — Shelter Workspace

The back-office for SPAs, shelters, associations, and rescue groups. **This is the first product built** — everything else derives from its data.

## Target user

The association manager: usually a volunteer, time-poor, moderately tech-comfortable (uses Facebook and WhatsApp daily, maybe Excel). Often manages 5–200 animals with 2–20 helpers. Her benchmark is not other software — it's "faster than my spreadsheet + Facebook routine".

## Jobs to be done

1. **"Keep track of our animals without a spreadsheet."**
2. **"Publish an adoption announcement once and reuse it everywhere."**
3. **"Post our news to socials without writing three versions."**
4. **"Show supporters exactly what we need money for."**
5. (Phase 4+) **"Find humans to help — transport, foster, hands, manage sqedules for volunteers, events and more  "**
6. (Phase 2) **"Make our hub page feel like our own website, not just a listing."**

## Feature areas

### F1. Organization & members
- Create organization: name, type (SPA / shelter / association loi 1901 / asociación / informal group), country (FR/ES — Spain shown but gated at signup until enabled, see ADR-004), address, contacts, logo, description.
- Verification: declare RNA/SIRET (FR) or registry number (ES); manual admin review at first (no API integration in MVP).
- Invite members by email; roles: **admin** (everything), **editor** (animals, posts, announcements).

### F2. Animal registry (the heart)
- Animal record: name, species, breed, sex, birth date (or estimate), chip/tattoo ID, sterilization, photos, arrival date & circumstances, health notes (free text + flags: needs treatment, special diet…), character notes, compatibility (kids/cats/dogs).
- **Status lifecycle:** `in care → adoptable → adoption pending → adopted` (side states: `fostered`, `transferred`, `deceased`).
- Timeline of events per animal (arrived, vet visit, fostered by X, adopted) — lightweight, append-only notes.
- List view with filters (species, status) + quick status change. Must be fast on mobile — managers work from the shelter floor.

### F3. Adoption announcements
- Generated **from** an animal record — no re-typing. Pick animal → compact card auto-drafts from registry data → edit tone/story → publish.
- Compact card format: 1 photo (+ gallery), name, key facts line (species · sex · age · sterilized · chip), 2–3 sentence story, compatibility icons, fee, contact.
- Publishing an announcement makes the animal visible on the Connection hub automatically.
- Announcement closes automatically when animal status changes to adopted.

### F4. Social post composer
- Compose posts from structured data: pick an animal / news item / cagnotte → choose template (adoption, arrival, success story, urgent need) → get generated text + image layout per network format (Facebook, Instagram caption + square/story image).
- MVP = **generate & copy**: produce ready-to-paste text and downloadable images. One-click copy per network. *(No social API integration in MVP — see ADR-006; Meta app review is a project in itself.)*
- Later: direct publish via Meta API, scheduling, post history.

### F5. Cagnottes (fund drives)
- Create: title, concrete goal ("we need 5 new cages"), target amount (informational), photo, deadline (optional), **link to external cagnotte** (HelloAsso, Teaming, Leetchi, GoFundMe…).
- Manual progress updates ("3/5 cages funded!") since we don't see external payment data in MVP.
- Auto-appears on the org's hub page; composer can generate posts for it.
- We never process money (ADR-005).

### F6. News posts
- Short updates: title, text, photos, optional linked animal(s)/cagnotte.
- Feed the social composer and the org's public hub page.

### F7. Org site editor (phase 2, extends the hub org page)
- Customize the org's public page on the connection hub (see connect-hub.md F3): section order (about, animals, cagnottes, news), a theme (colors/accent, from a small preset list), and custom blocks.
- Still data-driven, not a duplicate content system — animals/cagnottes/news populate automatically from the registry; the editor controls presentation and adds context around it, not a second place to enter animal data.
- Custom block types start minimal (free text / about-us) and grow over time based on what pilot orgs actually ask for (see the [site-editor-block-types decision issue](https://github.com/vic-corp-code/Anima/issues?q=is%3Aissue+label%3Adecision+block+types)).
- No new app: editing lives here (shelter workspace), rendering lives on the hub — keeps this an extension of the existing org page, not a fourth product.

### F8. Missions (phase 4, bridges to volunteer platform)
- Post a need: type (transport / foster / on-site help / event / skill e.g. photography, vet care), description, urgency (planned / soon / urgent), location or route (A→B for transports), time window, requirements.
- Review volunteer applications, accept/decline, mark completed.

## MVP cut (what phase 1 actually ships)

F1 (without registry verification API — manual), F2, F3, F5 (link-out only), minimal F6. F4 in phase 2 as generate-&-copy. F7 ships with phase 2 (basic theme + free-text blocks only). F8 waits for the volunteer platform.

## Explicitly out of scope

- Vet/medical record compliance, prescriptions, official documents.
- I-CAD / registry API integrations (open question).
- Inventory, accounting, membership fee management (other tools do this).
- Multi-shelter federations / hierarchy.

## Success metrics

- An association migrates off its spreadsheet and stays ≥ 4 weeks.
- Time from "new animal arrives" to "announcement live everywhere" < 10 minutes.
- ≥ 1 social post per week generated through the composer per active org.
