import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Organization-scoped authorization check
async function assertOrgAccess(
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

// Organization-scoped authorization check, requiring the admin role
async function assertAdminAccess(
  ctx: QueryCtx,
  organizationId: Id<"organizations">
) {
  const membership = await assertOrgAccess(ctx, organizationId);
  if (membership.role !== "admin") {
    throw new Error("Admin role required");
  }
  return membership;
}

const createAnimalArgs = {
  organizationId: v.id("organizations"),
  name: v.string(),
  species: v.union(v.literal("dog"), v.literal("cat")),
  breed: v.optional(v.string()),
  sex: v.union(v.literal("male"), v.literal("female"), v.literal("unknown")),
  chipId: v.optional(v.string()),
  identificationMethod: v.optional(
    v.union(v.literal("chip"), v.literal("tattoo"), v.literal("none"))
  ),
  birthDate: v.optional(v.string()),
  estimatedAge: v.optional(v.string()),
  arrivalDate: v.string(),
  sterilized: v.boolean(),
  healthNotes: v.optional(v.string()),
  characterNotes: v.optional(v.string()),
  compatibilityKids: v.boolean(),
  compatibilityCats: v.boolean(),
  compatibilityDogs: v.boolean(),
  photoUrls: v.optional(v.array(v.string())),
  story: v.optional(v.string()),
};

async function insertAnimal(
  ctx: MutationCtx,
  args: {
    organizationId: Id<"organizations">;
    name: string;
    species: "dog" | "cat";
    breed?: string;
    sex: "male" | "female" | "unknown";
    chipId?: string;
    identificationMethod?: "chip" | "tattoo" | "none";
    birthDate?: string;
    estimatedAge?: string;
    arrivalDate: string;
    sterilized: boolean;
    healthNotes?: string;
    characterNotes?: string;
    compatibilityKids: boolean;
    compatibilityCats: boolean;
    compatibilityDogs: boolean;
    photoUrls?: string[];
    story?: string;
  }
) {
  const animalId = await ctx.db.insert("animals", {
    organizationId: args.organizationId,
    name: args.name,
    species: args.species,
    breed: args.breed,
    sex: args.sex,
    chipId: args.chipId,
    identificationMethod: args.identificationMethod,
    birthDate: args.birthDate,
    estimatedAge: args.estimatedAge,
    status: "in_care", // Default status for new arrivals
    arrivalDate: args.arrivalDate,
    sterilized: args.sterilized,
    healthNotes: args.healthNotes,
    characterNotes: args.characterNotes,
    compatibilityKids: args.compatibilityKids,
    compatibilityCats: args.compatibilityCats,
    compatibilityDogs: args.compatibilityDogs,
    photoUrls: args.photoUrls ?? [],
    story: args.story,
  });

  // Create arrival event for timeline
  await ctx.db.insert("animalEvents", {
    animalId,
    organizationId: args.organizationId,
    eventType: "arrived",
    eventDate: args.arrivalDate,
    notes: `Animal arrived at ${args.organizationId}`,
  });

  return animalId;
}

// Create a new animal
export const create = mutation({
  args: createAnimalArgs,
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.organizationId);
    return await insertAnimal(ctx, args);
  },
});

// Same as `create`, but skips the auth check — for trusted internal callers
// that have already verified org membership earlier in their own call chain
// (e.g. the animal-intake chat agent's create_animal tool: `ctx.auth` isn't
// available inside a scheduled action, so `assertOrgAccess` would always
// throw "Not authenticated" there even for a legitimately authorized user —
// see animalChat.ts, where authorizeThreadAccess already checked membership
// before the action was ever scheduled).
export const createInternal = internalMutation({
  args: createAnimalArgs,
  handler: async (ctx, args) => {
    return await insertAnimal(ctx, args);
  },
});

// Update an existing animal
export const update = mutation({
  args: {
    animalId: v.id("animals"),
    name: v.optional(v.string()),
    species: v.optional(v.union(v.literal("dog"), v.literal("cat"))),
    breed: v.optional(v.string()),
    sex: v.optional(
      v.union(v.literal("male"), v.literal("female"), v.literal("unknown"))
    ),
    chipId: v.optional(v.string()),
    identificationMethod: v.optional(
      v.union(v.literal("chip"), v.literal("tattoo"), v.literal("none"))
    ),
    birthDate: v.optional(v.string()),
    estimatedAge: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("in_care"),
        v.literal("adoptable"),
        v.literal("adoption_pending"),
        v.literal("adopted"),
        v.literal("fostered"),
        v.literal("transferred"),
        v.literal("deceased")
      )
    ),
    arrivalDate: v.optional(v.string()),
    sterilized: v.optional(v.boolean()),
    healthNotes: v.optional(v.string()),
    characterNotes: v.optional(v.string()),
    compatibilityKids: v.optional(v.boolean()),
    compatibilityCats: v.optional(v.boolean()),
    compatibilityDogs: v.optional(v.boolean()),
    photoUrls: v.optional(v.array(v.string())),
    story: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) {
      throw new Error("Animal not found");
    }

    await assertOrgAccess(ctx, animal.organizationId);

    const updates: Record<string, any> = {};

    // Build update object with only provided fields
    if (args.name !== undefined) updates.name = args.name;
    if (args.species !== undefined) updates.species = args.species;
    if (args.breed !== undefined) updates.breed = args.breed;
    if (args.sex !== undefined) updates.sex = args.sex;
    if (args.chipId !== undefined) updates.chipId = args.chipId;
    if (args.identificationMethod !== undefined)
      updates.identificationMethod = args.identificationMethod;
    if (args.birthDate !== undefined) updates.birthDate = args.birthDate;
    if (args.estimatedAge !== undefined) updates.estimatedAge = args.estimatedAge;
    if (args.status !== undefined) updates.status = args.status;
    if (args.arrivalDate !== undefined) updates.arrivalDate = args.arrivalDate;
    if (args.sterilized !== undefined) updates.sterilized = args.sterilized;
    if (args.healthNotes !== undefined) updates.healthNotes = args.healthNotes;
    if (args.characterNotes !== undefined) updates.characterNotes = args.characterNotes;
    if (args.compatibilityKids !== undefined)
      updates.compatibilityKids = args.compatibilityKids;
    if (args.compatibilityCats !== undefined)
      updates.compatibilityCats = args.compatibilityCats;
    if (args.compatibilityDogs !== undefined)
      updates.compatibilityDogs = args.compatibilityDogs;
    if (args.photoUrls !== undefined) updates.photoUrls = args.photoUrls;
    if (args.story !== undefined) updates.story = args.story;

    await ctx.db.patch(args.animalId, updates);

    // If status changed, create a timeline event
    if (args.status !== undefined && args.status !== animal.status) {
      await ctx.db.insert("animalEvents", {
        animalId: args.animalId,
        organizationId: animal.organizationId,
        eventType: "status_change",
        eventDate: new Date().toISOString(),
        notes: `Status changed from ${animal.status} to ${args.status}`,
      });
    }

    return args.animalId;
  },
});

// Delete an animal
export const remove = mutation({
  args: {
    animalId: v.id("animals"),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) {
      throw new Error("Animal not found");
    }

    await assertAdminAccess(ctx, animal.organizationId);

    // Delete associated events first
    const events = await ctx.db
      .query("animalEvents")
      .withIndex("by_animal", (q) => q.eq("animalId", args.animalId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete the animal
    await ctx.db.delete(args.animalId);

    return args.animalId;
  },
});

// List animals for an organization
export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await assertOrgAccess(ctx, args.organizationId);

    return await ctx.db
      .query("animals")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

// Get a single animal by ID
export const get = query({
  args: {
    animalId: v.id("animals"),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) {
      return null;
    }

    await assertOrgAccess(ctx, animal.organizationId);

    return animal;
  },
});

// Get timeline events for an animal
export const getTimeline = query({
  args: {
    animalId: v.id("animals"),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) {
      return null;
    }

    await assertOrgAccess(ctx, animal.organizationId);

    const events = await ctx.db
      .query("animalEvents")
      .withIndex("by_animal", (q) => q.eq("animalId", args.animalId))
      .collect();

    return events.sort((a, b) =>
      a.eventDate.localeCompare(b.eventDate)
    );
  },
});

// Add a timeline event
export const addEvent = mutation({
  args: {
    animalId: v.id("animals"),
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
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) {
      throw new Error("Animal not found");
    }

    await assertOrgAccess(ctx, animal.organizationId);

    const eventId = await ctx.db.insert("animalEvents", {
      animalId: args.animalId,
      organizationId: animal.organizationId,
      eventType: args.eventType,
      eventDate: args.eventDate,
      notes: args.notes,
    });

    return eventId;
  },
});

// Add a manual timeline event (staff-created, distinct from auto-generated events)
export const addManualEvent = mutation({
  args: {
    animalId: v.id("animals"),
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
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) throw new Error("Animal not found");

    await assertOrgAccess(ctx, animal.organizationId);

    return await ctx.db.insert("animalEvents", {
      animalId: args.animalId,
      organizationId: animal.organizationId,
      eventType: args.eventType,
      eventDate: args.eventDate,
      notes: args.notes,
      isManual: true,
    });
  },
});

// Update a manual event's description, date, or type
export const updateEvent = mutation({
  args: {
    eventId: v.id("animalEvents"),
    eventType: v.optional(
      v.union(
        v.literal("arrived"),
        v.literal("vet_visit"),
        v.literal("sterilized"),
        v.literal("fostered"),
        v.literal("transferred"),
        v.literal("adopted"),
        v.literal("deceased"),
        v.literal("status_change"),
        v.literal("other")
      )
    ),
    eventDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    await assertOrgAccess(ctx, event.organizationId);

    const updates: Record<string, unknown> = {};
    if (args.eventType !== undefined) updates.eventType = args.eventType;
    if (args.eventDate !== undefined) updates.eventDate = args.eventDate;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.eventId, updates);
    return args.eventId;
  },
});

// Delete a manual event (auto-generated events cannot be deleted)
export const removeEvent = mutation({
  args: { eventId: v.id("animalEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    await assertOrgAccess(ctx, event.organizationId);

    if (!event.isManual) {
      throw new Error("Cannot delete auto-generated events");
    }

    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});

// --- Internal functions (no auth — used by the AI agent which authorizes at thread level) ---

export const listInternal = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    status: v.optional(
      v.union(
        v.literal("in_care"),
        v.literal("adoptable"),
        v.literal("adoption_pending"),
        v.literal("adopted"),
        v.literal("fostered"),
        v.literal("transferred"),
        v.literal("deceased"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("animals")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId));
    if (args.status) {
      q = q.filter((q) => q.eq(q.field("status"), args.status));
    }
    return await q.take(20);
  },
});

export const getInternal = internalQuery({
  args: { animalId: v.id("animals") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.animalId);
  },
});

export const updateInternal = internalMutation({
  args: {
    animalId: v.id("animals"),
    name: v.optional(v.string()),
    species: v.optional(v.union(v.literal("dog"), v.literal("cat"))),
    breed: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("unknown"))),
    chipId: v.optional(v.string()),
    identificationMethod: v.optional(v.union(v.literal("chip"), v.literal("tattoo"), v.literal("none"))),
    birthDate: v.optional(v.string()),
    estimatedAge: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("in_care"),
        v.literal("adoptable"),
        v.literal("adoption_pending"),
        v.literal("adopted"),
        v.literal("fostered"),
        v.literal("transferred"),
        v.literal("deceased"),
      ),
    ),
    arrivalDate: v.optional(v.string()),
    sterilized: v.optional(v.boolean()),
    healthNotes: v.optional(v.string()),
    characterNotes: v.optional(v.string()),
    compatibilityKids: v.optional(v.boolean()),
    compatibilityCats: v.optional(v.boolean()),
    compatibilityDogs: v.optional(v.boolean()),
    story: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) throw new Error("Animal not found");

    const { animalId, ...rest } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) updates[key] = value;
    }

    await ctx.db.patch(animalId, updates);

    if (args.status !== undefined && args.status !== animal.status) {
      await ctx.db.insert("animalEvents", {
        animalId,
        organizationId: animal.organizationId,
        eventType: "status_change",
        eventDate: new Date().toISOString(),
        notes: `Status changed from ${animal.status} to ${args.status}`,
      });
    }

    return animalId;
  },
});

export const archiveInternal = internalMutation({
  args: { animalId: v.id("animals") },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) throw new Error("Animal not found");
    if (animal.status === "deceased") throw new Error("Animal is already deceased");

    await ctx.db.patch(args.animalId, { status: "deceased" });
    await ctx.db.insert("animalEvents", {
      animalId: args.animalId,
      organizationId: animal.organizationId,
      eventType: "deceased",
      eventDate: new Date().toISOString(),
      notes: "Archived via AI agent",
    });
    return args.animalId;
  },
});

export const getTimelineInternal = internalQuery({
  args: { animalId: v.id("animals") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("animalEvents")
      .withIndex("by_animal", (q) => q.eq("animalId", args.animalId))
      .collect();
    return events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  },
});

export const addEventInternal = internalMutation({
  args: {
    animalId: v.id("animals"),
    eventType: v.union(
      v.literal("arrived"),
      v.literal("vet_visit"),
      v.literal("sterilized"),
      v.literal("fostered"),
      v.literal("transferred"),
      v.literal("adopted"),
      v.literal("deceased"),
      v.literal("status_change"),
      v.literal("other"),
    ),
    eventDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const animal = await ctx.db.get(args.animalId);
    if (!animal) throw new Error("Animal not found");
    return await ctx.db.insert("animalEvents", {
      animalId: args.animalId,
      organizationId: animal.organizationId,
      eventType: args.eventType,
      eventDate: args.eventDate,
      notes: args.notes,
      isManual: true,
    });
  },
});

export const updateEventInternal = internalMutation({
  args: {
    eventId: v.id("animalEvents"),
    eventType: v.optional(
      v.union(
        v.literal("arrived"),
        v.literal("vet_visit"),
        v.literal("sterilized"),
        v.literal("fostered"),
        v.literal("transferred"),
        v.literal("adopted"),
        v.literal("deceased"),
        v.literal("status_change"),
        v.literal("other"),
      ),
    ),
    eventDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    const { eventId, ...rest } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(eventId, updates);
    return eventId;
  },
});

export const removeEventInternal = internalMutation({
  args: { eventId: v.id("animalEvents") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (!event.isManual) throw new Error("Cannot delete auto-generated events");
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});
