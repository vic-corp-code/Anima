import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { assertOrgAccess } from "./access";

// Create a news post. Org-level, no lifecycle/status — the roadmap calls
// this "minimal F6" deliberately.
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    text: v.string(),
    photoUrls: v.optional(v.array(v.string())),
    linkedAnimalIds: v.optional(v.array(v.id("animals"))),
    linkedCagnotteId: v.optional(v.id("cagnottes")),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.organizationId);

    return await ctx.db.insert("newsPosts", {
      organizationId: args.organizationId,
      title: args.title,
      text: args.text,
      photoUrls: args.photoUrls ?? [],
      linkedAnimalIds: args.linkedAnimalIds ?? [],
      linkedCagnotteId: args.linkedCagnotteId,
    });
  },
});

// Edit a post's fields.
export const update = mutation({
  args: {
    newsPostId: v.id("newsPosts"),
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    photoUrls: v.optional(v.array(v.string())),
    linkedAnimalIds: v.optional(v.array(v.id("animals"))),
    linkedCagnotteId: v.optional(v.id("cagnottes")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.newsPostId);
    if (!post) throw new Error("News post not found");

    await assertOrgAccess(ctx, post.organizationId);

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.text !== undefined) updates.text = args.text;
    if (args.photoUrls !== undefined) updates.photoUrls = args.photoUrls;
    if (args.linkedAnimalIds !== undefined) updates.linkedAnimalIds = args.linkedAnimalIds;
    if (args.linkedCagnotteId !== undefined) updates.linkedCagnotteId = args.linkedCagnotteId;

    await ctx.db.patch(args.newsPostId, updates);
    return args.newsPostId;
  },
});

// Hard-delete a post — no archival status exists for this feature.
export const remove = mutation({
  args: { newsPostId: v.id("newsPosts") },
  handler: async (ctx, { newsPostId }) => {
    const post = await ctx.db.get(newsPostId);
    if (!post) throw new Error("News post not found");

    await assertOrgAccess(ctx, post.organizationId);

    await ctx.db.delete(newsPostId);
    return newsPostId;
  },
});

// List news posts for an organization.
export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await assertOrgAccess(ctx, organizationId);

    return await ctx.db
      .query("newsPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

// Single post, with linked animals/cagnotte resolved server-side for display.
export const get = query({
  args: { newsPostId: v.id("newsPosts") },
  handler: async (ctx, { newsPostId }) => {
    const post = await ctx.db.get(newsPostId);
    if (!post) return null;

    await assertOrgAccess(ctx, post.organizationId);

    const linkedAnimals = await Promise.all(
      (post.linkedAnimalIds ?? []).map((id) => ctx.db.get(id)),
    );
    const linkedCagnotte = post.linkedCagnotteId
      ? await ctx.db.get(post.linkedCagnotteId)
      : null;

    return {
      ...post,
      linkedAnimals: linkedAnimals.filter(
        (a): a is NonNullable<typeof a> => a !== null,
      ),
      linkedCagnotte,
    };
  },
});

// --- Internal functions (no auth — used by the AI agent) ---

export const listInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("newsPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(20);
  },
});

export const getInternal = internalQuery({
  args: { newsPostId: v.id("newsPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.newsPostId);
  },
});

export const createInternal = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    text: v.string(),
    photoUrls: v.optional(v.array(v.string())),
    linkedAnimalIds: v.optional(v.array(v.id("animals"))),
    linkedCagnotteId: v.optional(v.id("cagnottes")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("newsPosts", {
      organizationId: args.organizationId,
      title: args.title,
      text: args.text,
      photoUrls: args.photoUrls ?? [],
      linkedAnimalIds: args.linkedAnimalIds ?? [],
      linkedCagnotteId: args.linkedCagnotteId,
    });
  },
});

export const updateInternal = internalMutation({
  args: {
    newsPostId: v.id("newsPosts"),
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    photoUrls: v.optional(v.array(v.string())),
    linkedAnimalIds: v.optional(v.array(v.id("animals"))),
    linkedCagnotteId: v.optional(v.id("cagnottes")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.newsPostId);
    if (!post) throw new Error("News post not found");
    const { newsPostId, ...rest } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(args.newsPostId, updates);
    return args.newsPostId;
  },
});
