import "server-only";
import { col, fromDoc } from "./db";
import { DEPARTMENTS, PAGE_SIZE } from "./shared";
import type { CatalogQuery } from "./catalogQuery";
import type { Product } from "./types";

type Count = { name: string; count: number };
export type CatalogResult = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  facets: {
    price: { min: number; max: number };
    sizes: Count[];
    colors: Count[];
    collections: Count[];
    fabrics: Count[];
    occasions: Count[];
    departments: Count[];
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Filter clauses. `except` leaves one filter out so its own facet counts stay meaningful while you tick options. */
function clauses(q: CatalogQuery, except: string[] = []): any[] {
  const use = (k: string) => !except.includes(k);
  const c: any[] = [{ active: true }];
  if (q.q?.trim()) {
    const rx = new RegExp(escapeRx(q.q.trim()), "i");
    c.push({ $or: [{ name: rx }, { description: rx }, { sku: rx }] });
  }
  if (use("department") && q.department) c.push({ department: q.department });
  if (use("collection") && q.collections?.length) c.push({ collection: { $in: q.collections } });
  if (use("fabric") && q.fabrics?.length) c.push({ fabric: { $in: q.fabrics } });
  if (use("occasion") && q.occasions?.length) c.push({ occasion: { $in: q.occasions } });
  if (use("price")) {
    if (q.priceMin !== undefined) c.push({ price: { $gte: q.priceMin } });
    if (q.priceMax !== undefined) c.push({ price: { $lte: q.priceMax } });
  }
  if (use("size") && q.sizes?.length) c.push({ sizes: { $in: q.sizes } });
  if (use("color") && q.colors?.length) c.push({ "colors.name": { $in: q.colors } });
  if (use("discount") && q.discountMin) c.push({ discountPercent: { $gte: q.discountMin } });
  if (use("stock") && q.inStock) c.push({ stock: { $gt: 0 } });
  if (use("new") && q.isNew) c.push({ isNew: true });
  return c;
}
const match = (q: CatalogQuery, except: string[] = []) => ({ $match: { $and: clauses(q, except) } });

const SORT_STAGES: Record<string, any> = {
  featured: { trending: -1, createdAt: -1, _id: 1 },
  new: { createdAt: -1, _id: 1 },
  low: { price: 1, createdAt: -1, _id: 1 },
  high: { price: -1, createdAt: -1, _id: 1 },
  discount: { discountPercent: -1, createdAt: -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

const groupBy = (field: string) => [{ $group: { _id: field, n: { $sum: 1 } } }];
const toCounts = (rows: { _id: string; n: number }[]): Count[] => rows.filter((r) => r._id).map((r) => ({ name: r._id, count: r.n }));

/** Canonical size ordering so "S, M, L, XL" never shows up as "L, M, S, XL". */
const SIZE_ORDER = [...new Set(DEPARTMENTS.flatMap((d) => d.sizes))];
const sizeRank = (s: string) => { const i = SIZE_ORDER.indexOf(s); return i === -1 ? 999 : i; };

export async function queryProducts(q: CatalogQuery): Promise<CatalogResult> {
  const page = Math.max(1, q.page ?? 1);
  const products = await col("products");
  const price = { $addFields: { price: { $round: [{ $multiply: ["$mrp", { $subtract: [1, { $divide: [{ $ifNull: ["$discountPercent", 0] }, 100] }] }] }, 0] } } };

  const [res] = await products
    .aggregate(
      [
        price,
        {
          $facet: {
            items: [match(q), { $sort: SORT_STAGES[q.sort ?? "featured"] }, { $skip: (page - 1) * PAGE_SIZE }, { $limit: PAGE_SIZE }, { $project: { details: 0, care: 0, price: 0 } }],
            total: [match(q), { $count: "n" }],
            price: [match(q, ["price"]), { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } }],
            sizes: [match(q, ["size"]), { $unwind: "$sizes" }, ...groupBy("$sizes")],
            colors: [match(q, ["color"]), { $unwind: "$colors" }, ...groupBy("$colors.name")],
            collections: [match(q, ["collection"]), ...groupBy("$collection")],
            fabrics: [match(q, ["fabric"]), ...groupBy("$fabric")],
            occasions: [match(q, ["occasion"]), ...groupBy("$occasion")],
            departments: [match(q, ["department"]), ...groupBy("$department")],
          },
        },
      ],
      { collation: { locale: "en", strength: 2 } },
    )
    .toArray();

  const total: number = res.total[0]?.n ?? 0;
  return {
    items: res.items.map((d: any) => fromDoc<Product>(d)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    facets: {
      price: { min: res.price[0]?.min ?? 0, max: res.price[0]?.max ?? 0 },
      sizes: toCounts(res.sizes).sort((a, b) => sizeRank(a.name) - sizeRank(b.name) || a.name.localeCompare(b.name)),
      colors: toCounts(res.colors).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
      collections: toCounts(res.collections),
      fabrics: toCounts(res.fabrics),
      occasions: toCounts(res.occasions),
      departments: toCounts(res.departments),
    },
  };
}
