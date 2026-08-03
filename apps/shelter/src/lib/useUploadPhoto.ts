"use client";

import { useConvex, useMutation } from "convex/react";
import { api } from "@anima/backend/convex/_generated/api";
import { Id } from "@anima/backend/convex/_generated/dataModel";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Downscales large images client-side before upload — phone photos are
// routinely 3-10 MB / 4000px+. Falls back to the original file for
// non-raster or already-small images, or if the browser can't decode it
// (e.g. an unsupported format canvas can't draw).
async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  return new File([blob], file.name, { type: "image/jpeg" });
}

// Uploads a file to Convex storage and resolves to its servable URL.
// Doesn't require an existing animal, so it works both when creating a new
// animal and when editing one.
export function useUploadPhoto() {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const convex = useConvex();

  return async function uploadFile(file: File): Promise<string> {
    const resized = await resizeImage(file);
    const uploadUrl = await generateUploadUrl();

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": resized.type },
      body: resized,
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
