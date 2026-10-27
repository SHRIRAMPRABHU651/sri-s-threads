/**
 * Admin image upload.
 *  1. Shrink the photo in the browser (max 2000px, WebP/JPEG) — phones produce 4–8 MB files.
 *  2. Ask the server for a short-lived signature (admin only).
 *  3a. Cloudinary configured → upload straight to Cloudinary (no Vercel body-size limit, nothing passes through our server).
 *  3b. Not configured → fall back to POST /api/upload (stored in MongoDB).
 * The server decides which path is active, so development and production can differ without any code change.
 */
export async function compressImage(file: File, maxDim = 2000, quality = 0.84): Promise<Blob> {
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

type Signed = {
  provider: "cloudinary";
  uploadUrl: string;
  apiKey: string;
  params: Record<string, string | number>;
  signature: string;
};

function postWithProgress(url: string, form: FormData, onProgress?: (pct: number) => void): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* non-JSON error page */ }
      resolve({ status: xhr.status, body });
    };
    xhr.send(form);
  });
}

export async function uploadImage(file: File, onProgress?: (pct: number) => void): Promise<{ url: string } | { error: string }> {
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) return { error: "Please choose a JPG, PNG, WebP or GIF image." };
  const blob = await compressImage(file);

  const signRes = await fetch("/api/upload/sign").catch(() => null);
  if (signRes?.status === 401) { window.location.href = "/admin/login"; return { error: "Session expired" }; }
  const signed = (await signRes?.json().catch(() => null)) as Signed | { provider: "mongodb" } | null;
  if (!signed) return { error: "Couldn't reach the server. Check your connection." };

  try {
    if (signed.provider === "cloudinary") {
      const form = new FormData();
      Object.entries(signed.params).forEach(([k, v]) => form.append(k, String(v)));
      form.append("api_key", signed.apiKey);
      form.append("signature", signed.signature);
      form.append("file", blob, file.name);
      const { status, body } = await postWithProgress(signed.uploadUrl, form, onProgress);
      const url = body.secure_url as string | undefined;
      if (status >= 200 && status < 300 && url) return { url };
      return { error: (body.error as { message?: string } | undefined)?.message || "Cloudinary rejected the upload." };
    }
    const form = new FormData();
    form.append("file", blob, file.name);
    const { status, body } = await postWithProgress("/api/upload", form, onProgress);
    if (status === 401) { window.location.href = "/admin/login"; return { error: "Session expired" }; }
    if (status === 413) return { error: "Image is too large." };
    return typeof body.url === "string" ? { url: body.url } : { error: (body.error as string) || "Upload failed." };
  } catch (e) {
    return { error: (e as Error).message || "Upload failed." };
  }
}
