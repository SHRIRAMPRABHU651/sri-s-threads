import { deleteCoupon, listCoupons, saveCoupon } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { parseCoupon } from "@/lib/couponInput";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!(await listCoupons()).some((c) => c.id === params.id)) return fail("Coupon not found.", 404);
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseCoupon(body);
  if ("error" in parsed) return fail(parsed.error);
  const saved = await saveCoupon({ ...parsed, id: params.id });
  return "error" in saved ? fail(saved.error, 409) : json(saved);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return (await deleteCoupon(params.id)) ? json({ ok: true }) : fail("Coupon not found.", 404);
}
