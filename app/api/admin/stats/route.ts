import { json, requireAdmin } from "@/lib/api";
import { adminStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json(await adminStats());
}
