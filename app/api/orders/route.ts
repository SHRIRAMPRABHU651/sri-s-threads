import { getSettings, listOrders } from "@/lib/db";
import { placeOrder } from "@/lib/orders";
import { fail, json, num, readJson, requireAdmin, str } from "@/lib/api";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";

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

  const lines = Array.isArray(body.lines)
    ? body.lines.slice(0, 50).map((l: Record<string, unknown>) => ({
        productId: str(l?.productId, 40),
        qty: Math.max(1, Math.min(10, Math.round(num(l?.qty, 1)))),
        color: str(l?.color, 40) || undefined,
        size: str(l?.size, 20) || undefined,
      }))
    : [];
  if (lines.length === 0) return fail("Your bag is empty.");

  const result = await placeOrder({
    customer: { name, mobile, address, city, state, pincode, notes: str(c.notes, 300) || undefined },
    lines,
    couponCode: str(body.couponCode, 30).toUpperCase() || undefined,
  });
  if ("error" in result) return fail(result.error, 422);
  const settings = await getSettings();
  return json({ order: result, whatsappUrl: whatsappUrl(settings.whatsappNumber, orderMessage(result)) }, 201);
}
