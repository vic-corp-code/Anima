import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertOrgAccess, assertAdminAccess } from "./access";

// List members of an organization, with the caller's own role included so
// the frontend knows whether to show admin-only controls.
export const listForOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const callerMembership = await assertOrgAccess(ctx, organizationId);

    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    const members = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          userId: m.userId,
          name: user?.name ?? "",
          email: user?.email ?? "",
          role: m.role,
        };
      })
    );

    return { callerRole: callerMembership.role, members };
  },
});

// Remove a member (admin-only). Refuses to remove the org's last admin.
export const remove = mutation({
  args: { membershipId: v.id("memberships") },
  handler: async (ctx, { membershipId }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error("Membership not found");

    await assertAdminAccess(ctx, membership.organizationId);

    if (membership.role === "admin") {
      const admins = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", membership.organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();
      if (admins.length <= 1) {
        throw new Error("Cannot remove the organization's last admin");
      }
    }

    await ctx.db.delete(membershipId);
  },
});

// Change a member's role (admin-only). Refuses to demote the last admin.
export const updateRole = mutation({
  args: {
    membershipId: v.id("memberships"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  handler: async (ctx, { membershipId, role }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error("Membership not found");

    await assertAdminAccess(ctx, membership.organizationId);

    if (membership.role === "admin" && role !== "admin") {
      const admins = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", membership.organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "admin"))
        .collect();
      if (admins.length <= 1) {
        throw new Error("Cannot demote the organization's last admin");
      }
    }

    await ctx.db.patch(membershipId, { role });
  },
});
