import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fail, json, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX = 6 * 1024 * 1024;

/** Admin-only image upload → data/uploads (served via /uploads/[name]). Returns the public URL. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("No file uploaded.");
  const ext = TYPES[file.type];
  if (!ext) return fail("Only JPG, PNG, WebP or GIF images are allowed.");
  if (file.size > MAX) return fail("Image must be smaller than 6 MB.");
  const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "uploads");
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return json({ url: `/uploads/${name}` }, 201);
}
