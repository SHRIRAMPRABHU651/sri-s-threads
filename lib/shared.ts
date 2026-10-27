import type { Coupon, Product } from "./types";

export const BRAND = "Sri's Threads";

export const COLLECTION_KINDS = [
  { kind: "collection", title: "Top Collection", path: "/collections", param: "collection" },
  { kind: "fabric", title: "Shop by Fabric", path: "/collections/fabric", param: "fabric" },
  { kind: "occasion", title: "Shop by Occasion", path: "/collections/occasion", param: "occasion" },
] as const;

export const salePrice = (p: Pick<Product, "mrp" | "discountPercent">) =>
  Math.max(0, Math.round(p.mrp * (1 - (p.discountPercent || 0) / 100)));

export const inr = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type CouponResult =
  | { ok: true; discount: number; coupon: Pick<Coupon, "code" | "type" | "value" | "description"> }
  | { ok: false; error: string };

/** Pure coupon check shared by the validate API and order creation. */
export function evaluateCoupon(coupon: Coupon | undefined, subtotal: number, now = Date.now()): CouponResult {
  if (!coupon || !coupon.active) return { ok: false, error: "This coupon code is not valid." };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now)
    return { ok: false, error: "This coupon has expired." };
  if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit)
    return { ok: false, error: "This coupon has reached its usage limit." };
  if (subtotal < coupon.minOrder)
    return { ok: false, error: `Add items worth ${inr(coupon.minOrder)} or more to use this coupon.` };
  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.type === "percent" && coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(Math.round(discount), subtotal);
  return { ok: true, discount, coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description } };
}

export function couponHeadline(c: Pick<Coupon, "type" | "value">) {
  return c.type === "percent" ? `${c.value}% OFF` : `₹${c.value} OFF`;
}
