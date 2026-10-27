import { cookies } from "next/headers";
import { listCoupons, saveCoupon } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { COOKIE, verifySession } from "@/lib/auth";
import { parseCoupon } from "@/lib/couponInput";

export const dynamic = "force-dynamic";

/** Admins get everything; the public gets only live coupons (for the product-page offer cards). */
export async function GET() {
  const isAdmin = !!(await verifySession(cookies().get(COOKIE)?.value));
  const all = await listCoupons();
  if (isAdmin) return json(all);
  const now = Date.now();
  return json(
    all
      .filter((c) => c.active && (!c.expiresAt || new Date(c.expiresAt).getTime() > now) && (c.usageLimit === 0 || c.used < c.usageLimit))
      .map(({ code, description, type, value, minOrder, maxDiscount }) => ({ code, description, type, value, minOrder, maxDiscount })),
  );
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseCoupon(body);
  if ("error" in parsed) return fail(parsed.error);
  const saved = await saveCoupon(parsed);
  return "error" in saved ? fail(saved.error, 409) : json(saved, 201);
}
