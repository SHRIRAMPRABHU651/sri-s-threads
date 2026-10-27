import { getCouponByCode, getProduct } from "@/lib/db";
import { fail, json, num, readJson, str } from "@/lib/api";
import { evaluateCoupon, salePrice } from "@/lib/shared";
import type { CartLine } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Body: { code, lines: [{productId, qty}] } — subtotal is always recomputed server-side. */
export async function POST(req: Request) {
  const body = await readJson<{ code?: string; lines?: CartLine[] }>(req);
  if (!body) return fail("Invalid request body.");
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
  let subtotal = 0;
  for (const l of lines) {
    const p = await getProduct(str(l.productId, 40));
    if (p && p.active) subtotal += salePrice(p) * Math.max(1, Math.min(10, Math.round(num(l.qty, 1))));
  }
  const result = evaluateCoupon(await getCouponByCode(str(body.code, 30)), subtotal);
  return result.ok ? json({ ...result, subtotal }) : fail(result.error, 422);
}
