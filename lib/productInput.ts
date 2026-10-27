import { bool, num, str } from "./api";
import { CATEGORIES, FABRICS, OCCASIONS, TOP_COLLECTIONS, slugify } from "./shared";
import type { Product } from "./types";

type Input = Omit<Product, "id" | "createdAt">;

/** Validates & normalises an admin-submitted product. Returns an error string on failure. */
export function parseProduct(body: Record<string, unknown>): Input | { error: string } {
  const name = str(body.name, 160);
  if (name.length < 2) return { error: "Product name is required." };
  const mrp = Math.round(num(body.mrp));
  if (mrp <= 0) return { error: "MRP must be greater than 0." };
  const discountPercent = Math.min(90, Math.max(0, Math.round(num(body.discountPercent) * 100) / 100));

  const images = Array.isArray(body.images) ? body.images.map((i) => str(i, 500)).filter(Boolean).slice(0, 12) : [];
  if (images.length === 0) return { error: "Add at least one product image." };

  const colors = Array.isArray(body.colors)
    ? (body.colors as Record<string, unknown>[])
        .map((c) => ({ name: str(c?.name, 40), image: str(c?.image, 500) }))
        .filter((c) => c.name)
        .slice(0, 10)
    : [];

  const category = CATEGORIES.some((c) => c.slug === body.category) ? (body.category as Product["category"]) : "saree";
  const pick = (v: unknown, list: { slug: string }[]) => (list.some((x) => x.slug === v) ? String(v) : "");
  const saleEnds = str(body.saleEndsAt, 40);

  return {
    slug: slugify(str(body.slug, 160) || name),
    name,
    description: str(body.description),
    details: str(body.details),
    care: str(body.care),
    mrp,
    discountPercent,
    images,
    colors,
    size: str(body.size, 60) || "Free size",
    category,
    collection: pick(body.collection, TOP_COLLECTIONS),
    fabric: pick(body.fabric, FABRICS),
    occasion: pick(body.occasion, OCCASIONS),
    stock: Math.max(0, Math.round(num(body.stock))),
    isNew: bool(body.isNew),
    trending: bool(body.trending),
    active: body.active === undefined ? true : bool(body.active),
    saleEndsAt: saleEnds && !Number.isNaN(Date.parse(saleEnds)) ? new Date(saleEnds).toISOString() : undefined,
  };
}
