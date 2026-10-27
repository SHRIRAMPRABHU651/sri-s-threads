import "server-only";
import { createHash } from "crypto";

/**
 * Cloudinary integration (optional). When the CLOUDINARY_* variables are missing the app transparently falls back to
 * storing images in MongoDB, so local development and first deploys keep working.
 *
 * Isolation: every environment uploads to its own folder, and the server will only ever delete assets inside
 * its own folder — so a developer's machine or a preview deployment can never touch live images.
 *   production  → <base>/production
 *   preview     → <base>/preview
 *   everything else (local dev, local `next start`) → <base>/development
 */
export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; apiBase: string };

export function cloudinaryConfig(): CloudinaryConfig | null {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;
  // also accept the single-variable form Cloudinary shows in its dashboard: cloudinary://<key>:<secret>@<cloud>
  const url = process.env.CLOUDINARY_URL;
  if ((!cloudName || !apiKey || !apiSecret) && url) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (m) [apiKey, apiSecret, cloudName] = [m[1], m[2], m[3]];
  }
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret, apiBase: (process.env.CLOUDINARY_API_BASE || "https://api.cloudinary.com").replace(/\/$/, "") };
}

export function environmentName(): "production" | "preview" | "development" {
  if (process.env.VERCEL) {
    const v = process.env.VERCEL_ENV;
    return v === "production" ? "production" : v === "preview" ? "preview" : "development";
  }
  return "development";
}

export function uploadFolder(): string {
  const base = (process.env.CLOUDINARY_FOLDER || "sris-threads").replace(/^\/+|\/+$/g, "");
  return `${base}/${environmentName()}`;
}

type Params = Record<string, string | number | boolean | undefined>;

/** Cloudinary API signature: sha1 of the sorted `k=v` pairs joined with & plus the API secret. */
export function signParams(params: Params, secret: string): string {
  const str = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "" && !["file", "cloud_name", "resource_type", "api_key"].includes(k))
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(str + secret).digest("hex");
}

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif,avif";

/** Everything the browser needs to upload one image directly to Cloudinary. */
export function signUpload(cfg: CloudinaryConfig) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { allowed_formats: ALLOWED_FORMATS, folder: uploadFolder(), timestamp };
  return {
    provider: "cloudinary" as const,
    uploadUrl: `${cfg.apiBase}/v1_1/${cfg.cloudName}/image/upload`,
    apiKey: cfg.apiKey,
    params,
    signature: signParams(params, cfg.apiSecret),
  };
}

const URL_RE = /^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[A-Za-z0-9]+)?$/;

/** public_id for a plain (transformation-free) Cloudinary delivery URL that belongs to this cloud, else null. */
export function publicIdFromUrl(url: string, cfg: CloudinaryConfig): string | null {
  const m = URL_RE.exec(url);
  if (!m || m[1] !== cfg.cloudName) return null;
  const id = decodeURIComponent(m[2]);
  return id.includes(",") ? null : id; // a comma means a transformation segment — never guess
}

/** Delete an asset — only if it lives inside this environment's folder. Returns true when something was deleted. */
export async function destroyByUrl(url: string): Promise<boolean> {
  const cfg = cloudinaryConfig();
  if (!cfg) return false;
  const publicId = publicIdFromUrl(url, cfg);
  if (!publicId || !publicId.startsWith(`${uploadFolder()}/`)) return false;
  const params = { invalidate: "true", public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), api_key: cfg.apiKey, signature: signParams(params, cfg.apiSecret) });
  const res = await fetch(`${cfg.apiBase}/v1_1/${cfg.cloudName}/image/destroy`, { method: "POST", body });
  if (!res.ok) throw new Error(`Cloudinary destroy failed (${res.status})`);
  const json = (await res.json()) as { result?: string };
  return json.result === "ok";
}

/** Server-side upload of an in-memory image (used by the "move images to Cloudinary" tool). Returns the https URL. */
export async function uploadBuffer(data: Buffer, contentType: string): Promise<string> {
  const cfg = cloudinaryConfig();
  if (!cfg) throw new Error("Cloudinary is not configured.");
  const signed = signUpload(cfg);
  const form = new FormData();
  Object.entries(signed.params).forEach(([k, v]) => form.append(k, String(v)));
  form.append("api_key", signed.apiKey);
  form.append("signature", signed.signature);
  form.append("file", new Blob([new Uint8Array(data)], { type: contentType }), "upload");
  const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !json.secure_url) throw new Error(json.error?.message || `Cloudinary upload failed (${res.status})`);
  return json.secure_url;
}
