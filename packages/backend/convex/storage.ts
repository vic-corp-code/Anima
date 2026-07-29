import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generate an upload URL for storing an animal photo.
 * The client can use this URL to upload the file directly to Convex storage.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Resolve a storage ID (returned after uploading to a `generateUploadUrl`
 * URL) to a servable URL. Doesn't require an animal to already exist, so it
 * works for the "creating a new animal" flow, not just editing one.
 */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

/**
 * Store a photo URL for an animal after upload.
 * This is called after the client successfully uploads a file.
 */
export const addPhotoUrl = mutation({
  args: {
    storageId: v.string(),
    animalId: v.id("animals"),
  },
  handler: async (ctx, { storageId, animalId }) => {
    const animal = await ctx.db.get(animalId);
    if (!animal) {
      throw new Error("Animal not found");
    }

    // Get the public URL for the uploaded file
    const url = await ctx.storage.getUrl(storageId);
    if (!url) {
      throw new Error("Failed to get storage URL");
    }

    // Add the URL to the animal's photo array
    const updatedUrls = [...animal.photoUrls, url];
    await ctx.db.patch(animalId, {
      photoUrls: updatedUrls,
    });

    return url;
  },
});

/**
 * Delete a photo from an animal's photo array.
 */
export const deletePhoto = mutation({
  args: {
    animalId: v.id("animals"),
    photoUrl: v.string(),
  },
  handler: async (ctx, { animalId, photoUrl }) => {
    const animal = await ctx.db.get(animalId);
    if (!animal) {
      throw new Error("Animal not found");
    }

    const updatedUrls = animal.photoUrls.filter((url) => url !== photoUrl);
    await ctx.db.patch(animalId, {
      photoUrls: updatedUrls,
    });

    return { success: true };
  },
});
