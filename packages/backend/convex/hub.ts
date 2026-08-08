import { v } from "convex/values";
import { query } from "./_generated/server";

// Public, unauthenticated queries for apps/hub (Phase 2a — connect-hub.md F1).
// Unlike every other query in this backend, these are intentionally exposed
// with no org/auth check: the hub is a public read-only directory.

// Grid of published adoption announcements across all organizations, joined
// with the animal's display fields and the org's verification status.
// Unverified orgs are excluded by default (connect-hub.md F6).
export const listPublishedAnnouncements = query({
  args: {
    species: v.optional(v.union(v.literal("dog"), v.literal("cat"))),
    includeUnverified: v.optional(v.boolean()),
  },
  handler: async (ctx, { species, includeUnverified }) => {
    const announcements = await ctx.db
      .query("announcements")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const results = [];
    for (const announcement of announcements) {
      const animal = await ctx.db.get(announcement.animalId);
      if (!animal || (species && animal.species !== species)) continue;

      const organization = await ctx.db.get(announcement.organizationId);
      if (!organization) continue;
      if (!includeUnverified && organization.verificationStatus === "unverified") {
        continue;
      }

      results.push({
        _id: announcement._id,
        title: announcement.title,
        description: announcement.description,
        status: announcement.status,
        animalName: animal.name,
        animalSpecies: animal.species,
        photoUrl: animal.photoUrls[0],
        organizationId: organization._id,
        organizationName: organization.name,
        organizationVerificationStatus: organization.verificationStatus,
      });
    }
    return results;
  },
});

// Single published announcement with full animal + org detail for the
// public animal page. Returns null for anything not currently published,
// so a draft/closed/archived announcement is never reachable via the hub.
export const getPublishedAnnouncement = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement || announcement.status !== "published") return null;

    const animal = await ctx.db.get(announcement.animalId);
    const organization = await ctx.db.get(announcement.organizationId);
    if (!animal || !organization) return null;

    return {
      _id: announcement._id,
      title: announcement.title,
      description: announcement.description,
      animal: {
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        sex: animal.sex,
        photoUrls: animal.photoUrls,
        story: animal.story,
        sterilized: animal.sterilized,
        compatibilityKids: animal.compatibilityKids,
        compatibilityCats: animal.compatibilityCats,
        compatibilityDogs: animal.compatibilityDogs,
      },
      organization: {
        name: organization.name,
        type: organization.type,
        verificationStatus: organization.verificationStatus,
        address: organization.address,
      },
    };
  },
});
