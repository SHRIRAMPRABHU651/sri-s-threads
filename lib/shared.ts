import type { Coupon, Product } from "./types";

export const BRAND = "Sri's Threads";

export type CollectionCard = { slug: string; label: string; image: string };

/** "Top Collection" cards (Figma: Collection Page). */
export const TOP_COLLECTIONS: CollectionCard[] = [
  { slug: "silk-sarees", label: "Silk Sarees", image: "/assets/img/collection-1.webp" },
  { slug: "cotton-classic", label: "Cotton Classic", image: "/assets/img/collection-2.webp" },
  { slug: "pure-georgette", label: "Pure Georgette", image: "/assets/img/collection-3.webp" },
  { slug: "pure-muslin", label: "Pure Muslin", image: "/assets/img/collection-4.webp" },
  { slug: "festive-wear", label: "Festive Wear", image: "/assets/img/collection-5.webp" },
  { slug: "wedding-sarees", label: "Wedding Sarees", image: "/assets/img/collection-6.webp" },
];

/** "Shop by Fabric" cards (Figma: Collection Page (by fabric)). */
export const FABRICS: CollectionCard[] = [
  { slug: "silk", label: "Silk Sarees", image: "/assets/img/collection-1.webp" },
  { slug: "cotton", label: "Cotton Classic", image: "/assets/img/collection-2.webp" },
  { slug: "georgette", label: "Pure Georgette", image: "/assets/img/collection-3.webp" },
  { slug: "muslin", label: "Pure Muslin", image: "/assets/img/collection-4.webp" },
  { slug: "chanderi", label: "Chanderi", image: "/assets/img/collection-5.webp" },
  { slug: "banarasi", label: "Banarasi", image: "/assets/img/collection-6.webp" },
];

/** "Shop by Occasion" cards (Figma: Collection Page (by occassion)). */
export const OCCASIONS: CollectionCard[] = [
  { slug: "festive", label: "Festive Wear", image: "/assets/img/collection-1.webp" },
  { slug: "wedding", label: "Wedding Sarees", image: "/assets/img/collection-2.webp" },
  { slug: "party", label: "Party Wear", image: "/assets/img/collection-3.webp" },
  { slug: "casual", label: "Casual Wear", image: "/assets/img/collection-4.webp" },
  { slug: "office", label: "Office Wear", image: "/assets/img/collection-5.webp" },
  { slug: "daily", label: "Daily Wear", image: "/assets/img/collection-6.webp" },
];

export const CATEGORIES = [
  { slug: "saree", label: "Sarees" },
  { slug: "dress-material", label: "Dress Materials" },
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
