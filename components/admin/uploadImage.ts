/**
 * Shrinks a photo in the browser before upload (max 1400px, WebP/JPEG ~82%).
 * Phone photos are often 4–8 MB; Vercel rejects request bodies over 4.5 MB, and smaller images
 * also keep the free MongoDB tier going much longer.
 */
export async function compressImage(file: File, maxDim = 1400, quality = 0.82): Promise<Blob> {
  if (file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
    let out = await toBlob("image/webp");
    if (!out || out.type !== "image/webp") out = await toBlob("image/jpeg"); // older Safari can't encode WebP
    return out && out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const blob = await compressImage(file);
  const form = new FormData();
  form.append("file", blob, file.name);
  const res = await fetch("/api/upload", { method: "POST", body: form }).catch(() => null);
  const body = await res?.json().catch(() => null);
  if (res?.status === 401) { window.location.href = "/admin/login"; return { error: "Session expired" }; }
  return res?.ok && body?.url ? { url: body.url } : { error: body?.error || (res?.status === 413 ? "Image is too large." : "Upload failed.") };
}
