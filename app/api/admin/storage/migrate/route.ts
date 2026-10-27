import { fail, json, requireAdmin } from "@/lib/api";
import { migrateLegacyBatch } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Admin: move a small batch of MongoDB-stored images to Cloudinary. The UI calls this until `remaining` is 0. */
export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    return json(await migrateLegacyBatch(6));
  } catch (e) {
    return fail((e as Error).message, 400);
  }
}
