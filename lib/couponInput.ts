import { bool, num, str } from "./api";
import type { Coupon } from "./types";

export function parseCoupon(body: Record<string, unknown>): Omit<Coupon, "id" | "createdAt" | "used"> | { error: string } {
  const code = str(body.code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code.length < 3) return { error: "Coupon code must be at least 3 letters/numbers." };
  const type = body.type === "flat" ? "flat" : "percent";
  const value = num(body.value);
  if (value <= 0) return { error: "Discount value must be greater than 0." };
  if (type === "percent" && value > 100) return { error: "Percentage can't exceed 100." };
  const exp = str(body.expiresAt, 40);
  return {
    code,
    description: str(body.description, 120),
    type,
    value,
    minOrder: Math.max(0, Math.round(num(body.minOrder))),
    maxDiscount: Math.max(0, Math.round(num(body.maxDiscount))),
    active: body.active === undefined ? true : bool(body.active),
    usageLimit: Math.max(0, Math.round(num(body.usageLimit))),
    expiresAt: exp && !Number.isNaN(Date.parse(exp)) ? new Date(exp).toISOString() : undefined,
  };
}
