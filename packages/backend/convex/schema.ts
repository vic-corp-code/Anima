import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// First schema slice — see docs/roadmap/ROADMAP.md phase 0 and
// docs/product/overview.md's shared domain model.
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  organizations: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("spa"),
      v.literal("shelter"),
      v.literal("association"),
      v.literal("informal_group"),
    ),
    // Spain is shown but gated at signup until enabled — see ADR-004.
    country: v.union(v.literal("FR"), v.literal("ES")),
    address: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    verificationStatus: v.union(
      v.literal("unverified"),
      v.literal("email_verified"),
      v.literal("registry_verified"),
    ),
  }),

  memberships: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("editor")),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"]),
});
