import { GeospatialIndex } from "@convex-dev/geospatial";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { action, mutation, query } from "./_generated/server";

// Phase-0 geo spike (ROADMAP.md validation gate #1, architecture.md's top
// technical risk): geocode via Geoapify at write time, index in Convex's
// geospatial component, radius-query at read time. See ADR-008.
export const organizationsIndex = new GeospatialIndex<
  Id<"organizations">,
  { country: string }
>(components.geospatial);

export const geocodeAddress = action({
  args: { address: v.string() },
  handler: async (_ctx, { address }) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) throw new Error("GEOAPIFY_API_KEY is not set");

    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.set("text", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify request failed: ${response.status}`);
    }
    const data = await response.json();
    const result = data.results?.[0];
    if (!result) throw new Error(`No geocoding result for "${address}"`);

    return { latitude: result.lat as number, longitude: result.lon as number };
  },
});

export const setOrganizationLocation = mutation({
  args: {
    organizationId: v.id("organizations"),
    latitude: v.number(),
    longitude: v.number(),
  },
  handler: async (ctx, { organizationId, latitude, longitude }) => {
    const organization = await ctx.db.get(organizationId);
    if (!organization) throw new Error("Organization not found");

    await ctx.db.patch(organizationId, { latitude, longitude });
    await organizationsIndex.insert(
      ctx,
      organizationId,
      { latitude, longitude },
      { country: organization.country },
    );
  },
});

export const organizationsNearby = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radiusMeters: v.number(),
  },
  handler: async (ctx, { latitude, longitude, radiusMeters }) => {
    const result = await organizationsIndex.nearest(ctx, {
      point: { latitude, longitude },
      limit: 16,
      maxDistance: radiusMeters,
    });
    return result;
  },
});
