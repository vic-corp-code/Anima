import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { assertOrgAccess, assertAdminAccess } from "./access";

const SPECIES_LABEL = { dog: "chien", cat: "chat" } as const;

function draftTitle(name: string) {
  return `${name} cherche une famille`;
}

function draftDescription(animal: {
  name: string;
  species: "dog" | "cat";
  breed?: string;
  story?: string;
}) {
  if (animal.story) return animal.story;
  const species = SPECIES_LABEL[animal.species];
  const breed = animal.breed ? ` (${animal.breed})` : "";
  return `${animal.name}, ${species}${breed}, recherche une famille aimante. Contactez-nous pour en savoir plus.`;
}

// Create a draft announcement for an animal, auto-filling title/description
// from the animal record. Any org member can create.
export const create = mutation({
  args: { animalId: v.id("animals") },
  handler: async (ctx, { animalId }) => {
    const animal = await ctx.db.get(animalId);
    if (!animal) throw new Error("Animal not found");

    await assertOrgAccess(ctx, animal.organizationId);

    return await ctx.db.insert("announcements", {
      organizationId: animal.organizationId,
      animalId,
      title: draftTitle(animal.name),
      description: draftDescription(animal),
      status: "draft",
    });
  },
});

// Edit title/description while draft or published (not closed).
export const update = mutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { announcementId, title, description }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    await assertOrgAccess(ctx, announcement.organizationId);

    if (announcement.status === "closed" || announcement.status === "archived") {
      throw new Error("Cannot edit a closed or archived announcement");
    }

    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    await ctx.db.patch(announcementId, updates);
    return announcementId;
  },
});

export const publish = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    await assertOrgAccess(ctx, announcement.organizationId);

    if (announcement.status !== "draft") {
      throw new Error("Only a draft announcement can be published");
    }

    await ctx.db.patch(announcementId, {
      status: "published",
      publishedAt: Date.now(),
    });
    return announcementId;
  },
});

export const close = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    await assertOrgAccess(ctx, announcement.organizationId);

    if (announcement.status !== "published") {
      throw new Error("Only a published announcement can be closed");
    }

    await ctx.db.patch(announcementId, {
      status: "closed",
      closedAt: Date.now(),
    });
    return announcementId;
  },
});

export const archive = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");

    await assertAdminAccess(ctx, announcement.organizationId);

    if (announcement.status === "archived") {
      throw new Error("Announcement is already archived");
    }

    await ctx.db.patch(announcementId, {
      status: "archived",
      archivedAt: Date.now(),
    });
    return announcementId;
  },
});

// List announcements for an organization, optionally filtered by status.
export const list = query({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("published"),
        v.literal("closed"),
        v.literal("archived"),
      ),
    ),
  },
  handler: async (ctx, { organizationId, status }) => {
    await assertOrgAccess(ctx, organizationId);

    let query = ctx.db
      .query("announcements")
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

// All announcements for a single animal (history across drafts/relistings).
export const listForAnimal = query({
  args: { animalId: v.id("animals") },
  handler: async (ctx, { animalId }) => {
    const animal = await ctx.db.get(animalId);
    if (!animal) return [];

    await assertOrgAccess(ctx, animal.organizationId);

    return await ctx.db
      .query("announcements")
      .withIndex("by_animal", (q) => q.eq("animalId", animalId))
      .collect();
  },
});

export const get = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) return null;

    await assertOrgAccess(ctx, announcement.organizationId);

    const animal = await ctx.db.get(announcement.animalId);
    return { ...announcement, animal };
  },
});

// --- Internal functions (no auth — used by the AI agent) ---

export const listInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .take(20);
  },
});

export const getInternal = internalQuery({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.announcementId);
  },
});

export const createInternal = internalMutation({
  args: { animalId: v.id("animals") },
  handler: async (ctx, { animalId }) => {
    const animal = await ctx.db.get(animalId);
    if (!animal) throw new Error("Animal not found");
    return await ctx.db.insert("announcements", {
      organizationId: animal.organizationId,
      animalId,
      title: draftTitle(animal.name),
      description: draftDescription(animal),
      status: "draft",
    });
  },
});

export const updateInternal = internalMutation({
  args: {
    announcementId: v.id("announcements"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { announcementId, title, description }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");
    if (announcement.status === "closed" || announcement.status === "archived") {
      throw new Error("Cannot edit a closed or archived announcement");
    }
    const updates: Record<string, string> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    await ctx.db.patch(announcementId, updates);
    return announcementId;
  },
});

export const publishInternal = internalMutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");
    if (announcement.status !== "draft") throw new Error("Only a draft can be published");
    await ctx.db.patch(announcementId, { status: "published", publishedAt: Date.now() });
    return announcementId;
  },
});

export const closeInternal = internalMutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");
    if (announcement.status !== "published") throw new Error("Only a published announcement can be closed");
    await ctx.db.patch(announcementId, { status: "closed", closedAt: Date.now() });
    return announcementId;
  },
});

export const archiveInternal = internalMutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("Announcement not found");
    if (announcement.status === "archived") throw new Error("Already archived");
    await ctx.db.patch(announcementId, { status: "archived", archivedAt: Date.now() });
    return announcementId;
  },
});
