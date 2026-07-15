import { query } from "./_generated/server";

// Phase-0 SSR/SEO spike (ROADMAP.md validation gate #2): a public, unauth'd
// list query to prove Convex data can be server-rendered with ISR.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});
