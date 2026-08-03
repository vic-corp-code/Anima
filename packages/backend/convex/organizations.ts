import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminAccess } from "./access";

// Phase-0 SSR/SEO spike (ROADMAP.md validation gate #2): a public, unauth'd
// list query to prove Convex data can be server-rendered with ISR.
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const organizations = await Promise.all(
      memberships.map((m) => ctx.db.get(m.organizationId)),
    );

    return organizations.filter(Boolean);
  },
});

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("organizationId"), organizationId))
      .first();
    if (!membership) return null;

    return await ctx.db.get(organizationId);
  },
});

// Phase-0 exit gate (ROADMAP.md): a logged-in user creates an organization.
// Upserts the Clerk user into `users` on first org creation, then creates
// the org and an admin membership for that user, all in one mutation.
export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("spa"),
      v.literal("shelter"),
      v.literal("association"),
      v.literal("informal_group"),
    ),
    // Spain is shown but gated at signup until enabled — see ADR-004.
    country: v.literal("FR"),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        name: identity.name ?? identity.email ?? identity.subject,
        email: identity.email ?? "",
      });
      user = await ctx.db.get(userId);
    }
    if (!user) throw new Error("Failed to create user");

    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      country: args.country,
      address: args.address,
      verificationStatus: "unverified",
    });

    await ctx.db.insert("memberships", {
      userId: user._id,
      organizationId,
      role: "admin",
    });

    return organizationId;
  },
});

// Declare the org's registry number (RNA/SIRET for FR, registry number for
// ES) — self-attested, no API check. Admin-only; doesn't change
// verificationStatus on its own.
export const updateRegistryNumber = mutation({
  args: {
    organizationId: v.id("organizations"),
    registryNumber: v.string(),
  },
  handler: async (ctx, { organizationId, registryNumber }) => {
    await assertAdminAccess(ctx, organizationId);
    await ctx.db.patch(organizationId, { registryNumber });
  },
});

// Admin self-declares the org as verified. Requires a registry number to
// already be on file — no external check performed (MVP, see
// docs/product/shelter-app.md F1).
export const markVerified = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await assertAdminAccess(ctx, organizationId);

    const organization = await ctx.db.get(organizationId);
    if (!organization?.registryNumber) {
      throw new Error("Declare a registry number before marking as verified");
    }

    await ctx.db.patch(organizationId, { verificationStatus: "registry_verified" });
  },
});

// Reverts a mistaken verification back to unverified.
export const unmarkVerified = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await assertAdminAccess(ctx, organizationId);
    await ctx.db.patch(organizationId, { verificationStatus: "unverified" });
  },
});

// Delete an organization and all its data. Admin-only.
// Cascades through: memberships, invites, animals (with their events),
// announcements, cagnottes, newsPosts, and animalIntakeThreads.
export const remove = mutation({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await assertAdminAccess(ctx, organizationId);

    const organization = await ctx.db.get(organizationId);
    if (!organization) throw new Error("Organization not found");

    // Delete memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete invites
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete animals and their events
    const animals = await ctx.db
      .query("animals")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const animal of animals) {
      const events = await ctx.db
        .query("animalEvents")
        .withIndex("by_animal", (q) => q.eq("animalId", animal._id))
        .collect();
      for (const event of events) {
        await ctx.db.delete(event._id);
      }
      await ctx.db.delete(animal._id);
    }

    // Delete announcements
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const announcement of announcements) {
      await ctx.db.delete(announcement._id);
    }

    // Delete cagnottes
    const cagnottes = await ctx.db
      .query("cagnottes")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const cagnotte of cagnottes) {
      await ctx.db.delete(cagnotte._id);
    }

    // Delete news posts
    const newsPosts = await ctx.db
      .query("newsPosts")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const post of newsPosts) {
      await ctx.db.delete(post._id);
    }

    // Delete animal intake threads
    const threads = await ctx.db
      .query("animalIntakeThreads")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();
    for (const thread of threads) {
      await ctx.db.delete(thread._id);
    }

    await ctx.db.delete(organizationId);
    return organizationId;
  },
});
