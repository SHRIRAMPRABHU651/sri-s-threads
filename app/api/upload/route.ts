import { fail, json, requireAdmin } from "@/lib/api";
import { cloudinaryConfig, uploadBuffer } from "@/lib/cloudinary";
import { saveImage } from "@/lib/db";

export const dynamic = "force-dynamic";
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Vercel serverless request bodies are capped at 4.5 MB; the admin UI compresses photos before upload.
const MAX = 3.5 * 1024 * 1024;

/**
 * Admin-only server-side upload (fallback path; the admin UI normally uploads straight to Cloudinary).
 * Stores in Cloudinary when configured, otherwise in MongoDB (served from /uploads/[id]).
 */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("No file uploaded.");
  if (!TYPES.includes(file.type)) return fail("Only JPG, PNG, WebP or GIF images are allowed.");
  if (file.size > MAX) return fail("Image is too large (max 3.5 MB). Try a smaller photo.");
  const data = Buffer.from(await file.arrayBuffer());
  try {
    const url = cloudinaryConfig() ? await uploadBuffer(data, file.type) : await saveImage(data, file.type);
    return json({ url }, 201);
  } catch (e) {
    return fail((e as Error).message || "Upload failed.", 502);
  }
}
