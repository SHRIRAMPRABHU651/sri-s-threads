import type { Coupon, Department, DepartmentDef, Product } from "./types";

export const BRAND = "Sri's Threads";

/** Starter departments, written to the database the first time. After that they are managed in Admin → Departments. */
export const DEFAULT_DEPARTMENTS: DepartmentDef[] = [
  { slug: "women", label: "Women", blurb: "Sarees, chudidhar, kurtis, lehengas & more", image: "/assets/img/collection-1.webp", sizes: ["Free size", "XS", "S", "M", "L", "XL", "XXL"], active: true, sort: 10 },
  { slug: "men", label: "Men", blurb: "Kurtas, sherwanis, jackets & festive sets", image: "/assets/img/dept-men.webp", sizes: ["S", "M", "L", "XL", "XXL", "3XL"], active: true, sort: 20 },
  { slug: "kids", label: "Kids", blurb: "Festive and everyday ethnic wear for little ones", image: "/assets/img/dept-kids.webp", sizes: ["0-1Y", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y", "12-13Y"], active: true, sort: 30 },
  { slug: "accessories", label: "Accessories", blurb: "Jewellery, bags, dupattas, footwear & more", image: "/assets/img/dept-accessories.webp", sizes: ["Free size"], active: true, sort: 40 },
];

/** URL segments a department slug may never use (they are real pages / routes). */
export const RESERVED_SLUGS = ["shop", "cart", "checkout", "wishlist", "collections", "product", "admin", "api", "uploads", "sitemap", "robots", "icon", "apple-icon", "assets", "new", "sale"];

export const isDepartment = (v: unknown, list: Pick<DepartmentDef, "slug">[]): v is Department => typeof v === "string" && list.some((d) => d.slug === v);
export const departmentLabel = (slug: string, list: Pick<DepartmentDef, "slug" | "label">[] = DEFAULT_DEPARTMENTS) => list.find((d) => d.slug === slug)?.label ?? slug;

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

/** Shop list sort options (value is the URL `sort` param). */
export const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "new", label: "Newest first" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
  { value: "name", label: "Name: A to Z" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];

export const DISCOUNT_STEPS = [10, 20, 30, 40, 50] as const;
export const PAGE_SIZE = 12;
