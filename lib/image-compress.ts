/**
 * Resize and compress raster images for profile avatars (browser-side).
 * GIFs are returned unchanged so animation is preserved when small enough.
 */

const MAX_DIMENSION = 1200;
const OUTPUT_MIME = "image/jpeg";
const TARGET_MAX_BYTES = 2.5 * 1024 * 1024;

export type PreparedAvatar =
  | { blob: Blob; pathSuffix: "jpg" }
  | { blob: Blob; pathSuffix: "gif" };

export async function prepareAvatarForUpload(file: File): Promise<PreparedAvatar> {
  if (file.type === "image/gif") {
    return { blob: file, pathSuffix: "gif" };
  }

  if (file.type !== "image/jpeg" && file.type !== "image/png" && file.type !== "image/webp") {
    throw new Error("Use JPG, PNG, WebP, or GIF.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let width = bitmap.width;
    let height = bitmap.height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION) / width);
        width = MAX_DIMENSION;
      } else {
        width = Math.round((width * MAX_DIMENSION) / height);
        height = MAX_DIMENSION;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not process this image in your browser.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.88;
    let blob: Blob | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), OUTPUT_MIME, quality);
      });
      if (!blob) {
        throw new Error("Could not compress this image.");
      }
      if (blob.size <= TARGET_MAX_BYTES || quality <= 0.5) {
        break;
      }
      quality -= 0.1;
    }

    if (!blob) {
      throw new Error("Could not compress this image.");
    }

    return { blob, pathSuffix: "jpg" };
  } finally {
    bitmap.close();
  }
}
