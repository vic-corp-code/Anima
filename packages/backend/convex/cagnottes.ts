import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { assertOrgAccess, assertAdminAccess } from "./access";

// Create a cagnotte. Progress starts at 0 (or the seeded currentAmount) and
// is updated manually by the org — Anima never touches money (ADR-005),
// this only links out.
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    goalDescription: v.string(),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    externalUrl: v.string(),
    photoUrl: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.organizationId);

    // Amounts are the trust boundary — the UI only hints with min="0".
    if (args.targetAmount !== undefined && args.targetAmount < 0) {
      throw new Error("targetAmount must not be negative");
    }
    if (args.currentAmount !== undefined && args.currentAmount < 0) {
      throw new Error("currentAmount must not be negative");
    }

    return await ctx.db.insert("cagnottes", {
      organizationId: args.organizationId,
      title: args.title,
      goalDescription: args.goalDescription,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount ?? 0,
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

    if (args.targetAmount !== undefined && args.targetAmount < 0) {
      throw new Error("targetAmount must not be negative");
    }

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

    if (currentAmount < 0) {
      throw new Error("currentAmount must not be negative");
    }

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

export const archive = mutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");

    await assertAdminAccess(ctx, cagnotte.organizationId);

    if (cagnotte.status === "archived") {
      throw new Error("Cagnotte is already archived");
    }

    await ctx.db.patch(cagnotteId, {
      status: "archived",
      archivedAt: Date.now(),
    });
    return cagnotteId;
  },
});

// List cagnottes for an organization, optionally filtered by status.
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(v.literal("active"), v.literal("closed"), v.literal("archived")),
    ),
  },
  handler: async (ctx, { organizationId, status }) => {
    await assertOrgAccess(ctx, organizationId);

    let query = ctx.db
      .query("cagnottes")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    if (status) {
      query = query.filter((q) => q.eq(q.field("status"), status));
    } else {
      // Archived is a soft-delete — hide it from the default (unfiltered) view.
      query = query.filter((q) => q.neq(q.field("status"), "archived"));
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

// --- Internal functions (no auth — used by the AI agent) ---

export const listInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cagnottes")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(20);
  },
});

export const getInternal = internalQuery({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cagnotteId);
  },
});

export const createInternal = internalMutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    goalDescription: v.string(),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    externalUrl: v.string(),
    photoUrl: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.targetAmount !== undefined && args.targetAmount < 0) {
      throw new Error("targetAmount must not be negative");
    }
    if (args.currentAmount !== undefined && args.currentAmount < 0) {
      throw new Error("currentAmount must not be negative");
    }

    return await ctx.db.insert("cagnottes", {
      organizationId: args.organizationId,
      title: args.title,
      goalDescription: args.goalDescription,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount ?? 0,
      externalUrl: args.externalUrl,
      photoUrl: args.photoUrl,
      deadline: args.deadline,
      status: "active",
    });
  },
});

export const updateInternal = internalMutation({
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
    if (args.targetAmount !== undefined && args.targetAmount < 0) {
      throw new Error("targetAmount must not be negative");
    }
    const { cagnotteId, ...rest } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(cagnotteId, updates);
    return cagnotteId;
  },
});

export const updateProgressInternal = internalMutation({
  args: { cagnotteId: v.id("cagnottes"), currentAmount: v.number() },
  handler: async (ctx, { cagnotteId, currentAmount }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");
    if (currentAmount < 0) {
      throw new Error("currentAmount must not be negative");
    }
    await ctx.db.patch(cagnotteId, { currentAmount });
    return cagnotteId;
  },
});

export const closeInternal = internalMutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");
    await ctx.db.patch(cagnotteId, { status: "closed" });
    return cagnotteId;
  },
});

export const reopenInternal = internalMutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");
    await ctx.db.patch(cagnotteId, { status: "active" });
    return cagnotteId;
  },
});

export const archiveInternal = internalMutation({
  args: { cagnotteId: v.id("cagnottes") },
  handler: async (ctx, { cagnotteId }) => {
    const cagnotte = await ctx.db.get(cagnotteId);
    if (!cagnotte) throw new Error("Cagnotte not found");
    if (cagnotte.status === "archived") throw new Error("Already archived");
    await ctx.db.patch(cagnotteId, { status: "archived", archivedAt: Date.now() });
    return cagnotteId;
  },
});
