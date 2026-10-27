import { addSubscriber, listSubscribers } from "@/lib/db";
import { fail, json, readJson, requireAdmin, str } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json(await listSubscribers());
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const email = str(body?.email, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Please enter a valid email address.");
  await addSubscriber(email);
  return json({ ok: true }, 201);
}
