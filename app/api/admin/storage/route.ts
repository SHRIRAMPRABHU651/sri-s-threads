import { json, requireAdmin } from "@/lib/api";
import { storageStatus } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json(await storageStatus());
}
