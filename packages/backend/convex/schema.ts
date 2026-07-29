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
    // Geocoded from `address` via Geoapify at write time — see ADR-008.
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
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

  invites: defineTable({
    organizationId: v.id("organizations"),
    role: v.union(v.literal("admin"), v.literal("editor")),
    token: v.string(),
    createdBy: v.id("users"),
    usedBy: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_organization", ["organizationId"]),

  animals: defineTable({
    // Organization linkage
    organizationId: v.id("organizations"),

    // Core identification
    name: v.string(),
    species: v.union(v.literal("dog"), v.literal("cat")),
    breed: v.optional(v.string()),
    sex: v.union(v.literal("male"), v.literal("female"), v.literal("unknown")),

    // Identification (French legal requirements)
    chipId: v.optional(v.string()), // I-CAD 15-digit code
    identificationMethod: v.optional(v.union(
      v.literal("chip"),
      v.literal("tattoo"),
      v.literal("none")
    )),

    // Age
    birthDate: v.optional(v.string()), // ISO date string or "unknown"
    estimatedAge: v.optional(v.string()), // e.g., "1 year", "6 months"

    // Status & lifecycle
    status: v.union(
      v.literal("in_care"),
      v.literal("adoptable"),
      v.literal("adoption_pending"),
      v.literal("adopted"),
      v.literal("fostered"),
      v.literal("transferred"),
      v.literal("deceased")
    ),

    // Arrival (French legal requirement)
    arrivalDate: v.string(), // Required for legal compliance

    // Health & care
    sterilized: v.boolean(),
    healthNotes: v.optional(v.string()),

    // Behavior & compatibility
    characterNotes: v.optional(v.string()),
    compatibilityKids: v.boolean(),
    compatibilityCats: v.boolean(),
    compatibilityDogs: v.boolean(),

    // Media
    photoUrls: v.array(v.string()), // Convex storage URLs
    story: v.optional(v.string()), // Public-facing story for adoption
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"]),

  announcements: defineTable({
    organizationId: v.id("organizations"),
    animalId: v.id("animals"),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("closed"),
    ),
    publishedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_animal", ["animalId"]),

  cagnottes: defineTable({
    organizationId: v.id("organizations"),
    title: v.string(),
    goalDescription: v.string(),
    targetAmount: v.optional(v.number()),
    currentAmount: v.number(),
    externalUrl: v.string(),
    photoUrl: v.optional(v.string()),
    deadline: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("closed")),
  }).index("by_organization", ["organizationId"]),

  animalEvents: defineTable({
    // Event tracking for timeline (French legal requirement for record-keeping)
    animalId: v.id("animals"),
    organizationId: v.id("organizations"),
    eventType: v.union(
      v.literal("arrived"),
      v.literal("vet_visit"),
      v.literal("sterilized"),
      v.literal("fostered"),
      v.literal("transferred"),
      v.literal("adopted"),
      v.literal("deceased"),
      v.literal("status_change"),
      v.literal("other")
    ),
    eventDate: v.string(),
    notes: v.optional(v.string()),
    // Optional: reference to related records (adoptions, transfers, etc.)
    relatedId: v.optional(v.id("animals")),
  })
    .index("by_animal", ["animalId"])
    .index("by_organization", ["organizationId"]),
});
