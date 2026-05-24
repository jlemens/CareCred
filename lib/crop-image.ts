/** Pixel rectangle from a crop UI (e.g. react-easy-crop). */
export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Crops a raster image to the given pixel region and returns JPEG.
 */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: PixelCrop,
): Promise<Blob> {
  const response = await fetch(imageSrc);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const w = Math.max(1, Math.round(pixelCrop.width));
    const h = Math.max(1, Math.round(pixelCrop.height));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not crop this image in your browser.");
    }
    ctx.drawImage(
      bitmap,
      Math.round(pixelCrop.x),
      Math.round(pixelCrop.y),
      w,
      h,
      0,
      0,
      w,
      h,
    );
    const out = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
    });
    if (!out) {
      throw new Error("Could not crop this image.");
    }
    return out;
  } finally {
    bitmap.close();
  }
}
