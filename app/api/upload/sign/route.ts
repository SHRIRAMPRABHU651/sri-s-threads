import { json, requireAdmin } from "@/lib/api";
import { cloudinaryConfig, signUpload } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/**
 * Admin only. Returns a short-lived signature so the browser can upload straight to Cloudinary
 * (bypassing Vercel's 4.5 MB request limit). Without Cloudinary credentials → { provider: "mongodb" } and the UI falls back
 * to POST /api/upload.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const cfg = cloudinaryConfig();
  return json(cfg ? signUpload(cfg) : { provider: "mongodb" as const });
}
