import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAccess } from "./access";

// Create a cagnotte. Progress starts at 0 and is updated manually by the
// org — Anima never touches money (ADR-005), this only links out.
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    goalDescription: v.string(),
    targetAmount: v.optional(v.number()),
    externalUrl: v.string(),
    photoUrl: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.organizationId);

    return await ctx.db.insert("cagnottes", {
      organizationId: args.organizationId,
      title: args.title,
      goalDescription: args.goalDescription,
      targetAmount: args.targetAmount,
      currentAmount: 0,
      externalUrl: args.externalUrl,
      photoUrl: args.photoUrl,
      deadline: args.deadline,
      status: "active",
    });
  },
});

// Edit the cagnotte's descriptive fields.
export const update = mutation({
  args: {
    cagnotteId: v.id("cagnottes"),
    title: v.optional(v.string()),
    goalDescription: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    externalUrl: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cagnotte = await ctx.db.get(args.cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");

    await assertOrgAccess(ctx, cagnotte.organizationId);

    const updates: Record<string, string | number> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.goalDescription !== undefined) updates.goalDescription = args.goalDescription;
    if (args.targetAmount !== undefined) updates.targetAmount = args.targetAmount;
    if (args.externalUrl !== undefined) updates.externalUrl = args.externalUrl;
    if (args.photoUrl !== undefined) updates.photoUrl = args.photoUrl;
    if (args.deadline !== undefined) updates.deadline = args.deadline;

    await ctx.db.patch(args.cagnotteId, updates);
    return args.cagnotteId;
  },
});

// The operation an org will do most often: bump the manually-tracked
// progress number. Kept separate from `update` since it's a distinct,
// frequent action, not a general edit.
export const updateProgress = mutation({
  args: {
    cagnotteId: v.id("cagnottes"),
    currentAmount: v.number(),
  },
  handler: async (ctx, { cagnotteId, currentAmount }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");

    await assertOrgAccess(ctx, cagnotte.organizationId);

    await ctx.db.patch(cagnotteId, { currentAmount });
    return cagnotteId;
  },
});

export const close = mutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");

    await assertOrgAccess(ctx, cagnotte.organizationId);

    await ctx.db.patch(cagnotteId, { status: "closed" });
    return cagnotteId;
  },
});

export const reopen = mutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");

    await assertOrgAccess(ctx, cagnotte.organizationId);

    await ctx.db.patch(cagnotteId, { status: "active" });
    return cagnotteId;
  },
});

// List cagnottes for an organization, optionally filtered by status.
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(v.union(v.literal("active"), v.literal("closed"))),
  },
  handler: async (ctx, { organizationId, status }) => {
    await assertOrgAccess(ctx, organizationId);

    let query = ctx.db
      .query("cagnottes")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    }

    return await query.collect();
  },
});

export const get = query({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) return null;

    await assertOrgAccess(ctx, cagnotte.organizationId);

    return cagnotte;
  },
});
