"use client";

import { useConvex, useMutation } from "convex/react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";

// Uploads a file to Convex storage and resolves to its servable URL.
// Doesn't require an existing animal, so it works both when creating a new
// animal and when editing one.
export function useUploadPhoto() {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const convex = useConvex();

  return async function uploadFile(file: File): Promise<string> {
    const uploadUrl = await generateUploadUrl();

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) {
      throw new Error("Failed to upload photo");
    }

    const { storageId } = (await response.json()) as { storageId: Id<"_storage"> };

    const url = await convex.query(api.storage.getUrl, { storageId });
    if (!url) {
      throw new Error("Failed to resolve uploaded photo URL");
    }

    return url;
  };
}
