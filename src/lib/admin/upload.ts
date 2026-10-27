import { getBrowserClient } from "@/lib/supabase/browser";
import { PRODUCT_IMAGE_BUCKET } from "@/lib/supabase/env";

/** Downscale large photos in the browser before upload (max 2000px, JPEG). */
export async function prepare(file: File, max = 2000): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", 0.86));
  } catch {
    return file;
  }
}

/** Upload one image to the store's image bucket and return its public URL. */
export async function uploadImage(file: File, folder: string, max = 2000): Promise<string> {
  const blob = await prepare(file, max);
  const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const supabase = getBrowserClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}
