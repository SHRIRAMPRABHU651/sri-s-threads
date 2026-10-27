import { cookies } from "next/headers";
import { COOKIE, verifySession } from "@/lib/auth";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await verifySession(cookies().get(COOKIE)?.value);
  return json({ admin: !!s, user: s?.u ?? null });
}
