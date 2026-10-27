import { createOrder, getSettings, listOrders } from "@/lib/db";
import { fail, json, num, readJson, requireAdmin, str } from "@/lib/api";
import { evaluateCoupon, salePrice } from "@/lib/shared";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";
import type { OrderItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return json(await listOrders());
}

/** Public: customer submits name, mobile, address + cart. Prices are always recomputed here. */
export async function POST(req: Request) {
  const body = await readJson<Record<string, any>>(req);
  if (!body) return fail("Invalid request body.");

  const c = body.customer ?? {};
  const name = str(c.name, 80);
  const digits = String(c.mobile ?? "").replace(/\D/g, "");
  const mobile = digits.length > 10 ? digits.slice(-10) : digits;
  const address = str(c.address, 300);
  const city = str(c.city, 80);
  const state = str(c.state, 80);
  const pincode = String(c.pincode ?? "").replace(/\D/g, "");
  if (name.length < 2) return fail("Please enter your name.");
  if (!/^[6-9]\d{9}$/.test(mobile)) return fail("Please enter a valid 10-digit mobile number.");
  if (address.length < 5) return fail("Please enter your full address.");
  if (!city) return fail("Please enter your city.");
  if (!state) return fail("Please enter your state.");
  if (!/^\d{6}$/.test(pincode)) return fail("Please enter a valid 6-digit pincode.");

  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 50) : [];
  if (lines.length === 0) return fail("Your bag is empty.");
  const couponCode = str(body.couponCode, 30).toUpperCase();

  const settings = await getSettings();
  const result = await createOrder((db) => {
    const items: OrderItem[] = [];
    for (const l of lines) {
      const p = db.products.find((x) => x.id === str(l?.productId, 40));
      if (!p || !p.active) return { error: "One of the items in your bag is no longer available." };
      const qty = Math.max(1, Math.min(10, Math.round(num(l.qty, 1))));
      if (p.stock < 1) return { error: `${p.name} is out of stock.` };
      const color = str(l.color, 40) || undefined;
      const image = p.colors.find((x) => x.name === color)?.image || p.images[0];
      items.push({ productId: p.id, name: p.name, image, color, qty, price: salePrice(p), mrp: p.mrp });
    }
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    let appliedCode: string | undefined;
    if (couponCode) {
      const check = evaluateCoupon(db.coupons.find((x) => x.code === couponCode), subtotal);
      if (!check.ok) return { error: check.error };
      discount = check.discount;
      appliedCode = check.coupon.code;
    }
    return {
      customer: { name, mobile, address, city, state, pincode, notes: str(c.notes, 300) || undefined },
      items,
      subtotal,
      discount,
      couponCode: appliedCode,
      total: subtotal - discount,
    };
  });
  if ("error" in result) return fail(result.error, 422);
  return json({ order: result, whatsappUrl: whatsappUrl(settings.whatsappNumber, orderMessage(result)) }, 201);
}
