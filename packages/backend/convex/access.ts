import { QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function assertOrgAccess(
  ctx: QueryCtx,
  organizationId: Id<"organizations">
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("Not a member of this organization");
  }

  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_user", (q) => q.eq("userId", user._id))
    .filter((q) => q.eq(q.field("organizationId"), organizationId))
    .first();

  if (!membership) {
    throw new Error("Not a member of this organization");
  }

  return membership;
}

export async function assertAdminAccess(
  ctx: QueryCtx,
  organizationId: Id<"organizations">
) {
  const membership = await assertOrgAccess(ctx, organizationId);
  if (membership.role !== "admin") {
    throw new Error("Admin role required");
  }
  return membership;
}
