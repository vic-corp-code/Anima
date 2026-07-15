#!/bin/bash
# Vercel Build Command entrypoint (see docs/tech/architecture.md's SEO/deploy
# notes). `convex deploy`'s --cmd runs BEFORE it regenerates convex/_generated,
# so --cmd here only captures the preview deployment URL to a file instead of
# building the app directly. The actual Next.js build runs afterward, once
# convex deploy has fully finished (generated files now exist).
set -e
cd "$(dirname "$0")"

bunx convex deploy \
  --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL \
  --cmd 'echo "$NEXT_PUBLIC_CONVEX_URL" > .preview-convex-url'

cd ../../apps/shelter
export NEXT_PUBLIC_CONVEX_URL="$(cat ../../packages/backend/.preview-convex-url)"
bun run build
