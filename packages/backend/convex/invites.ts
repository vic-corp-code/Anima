import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdminAccess } from "./access";

// Create a shareable invite link for an organization (admin-only).
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  handler: async (ctx, { organizationId, role }) => {
    const membership = await assertAdminAccess(ctx, organizationId);

    const token = crypto.randomUUID();
    await ctx.db.insert("invites", {
      organizationId,
      role,
      token,
      createdBy: membership.userId,
    });

    return token;
  },
});

// List pending (unused) invites for an organization (admin-only).
export const listForOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await assertAdminAccess(ctx, organizationId);

    const invites = await ctx.db
      .query("invites")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    return invites
      .filter((invite) => !invite.usedAt)
      .map((invite) => ({
        inviteId: invite._id,
        role: invite.role,
        createdAt: invite._creationTime,
      }));
  },
});

// Revoke a pending invite (admin-only). The link immediately stops working.
export const revoke = mutation({
  args: { inviteId: v.id("invites") },
  handler: async (ctx, { inviteId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error("Invite not found");

    await assertAdminAccess(ctx, invite.organizationId);

    await ctx.db.delete(inviteId);
  },
});

// Public: look up an invite by token to show "you've been invited to X"
// before the visitor is necessarily signed in.
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invite || invite.usedAt) return null;

    const organization = await ctx.db.get(invite.organizationId);
    if (!organization) return null;

    return { organizationName: organization.name, role: invite.role };
  },
});

// Accept an invite: upsert the Clerk user, create their membership at the
// invite's role, and mark the invite as used (single-use).
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (!invite || invite.usedAt) throw new Error("Invite is invalid or already used");

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        name: identity.name ?? identity.email ?? "",
        email: identity.email ?? "",
      });
      user = await ctx.db.get(userId);
    }
    if (!user) throw new Error("Failed to create user");

    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("organizationId"), invite.organizationId))
      .first();

    if (!existingMembership) {
      await ctx.db.insert("memberships", {
        userId: user._id,
        organizationId: invite.organizationId,
        role: invite.role,
      });
    }

    await ctx.db.patch(invite._id, { usedBy: user._id, usedAt: Date.now() });

    return invite.organizationId;
  },
});
