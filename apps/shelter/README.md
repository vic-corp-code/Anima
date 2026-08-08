# BO-Shelter

The back-office admin app for shelters and associations: animal registry, adoption announcements, cagnottes, the social post composer, and org/member management. Part of the Anima monorepo — see the [root README](../../README.md) for how this fits with Hub and ShelterWeb, and [CLAUDE.md](../../CLAUDE.md) for dev conventions and first-time setup (Convex, Clerk, Vercel).

## Development

From the repo root:

```bash
bun run dev --filter=@anima/shelter
```

Or from this directory: `bun run dev`. Open [http://localhost:3000](http://localhost:3000).

This app uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to load Geist, and was originally bootstrapped with `create-next-app`.
