import { SORTS, type SortValue } from "./shared";
import type { Department } from "./types";

/** Shop-list filters. Lives in the URL so every filtered view is shareable and back-button friendly. */
export type CatalogQuery = {
  department?: Department;
  q?: string;
  collections?: string[];
  fabrics?: string[];
  occasions?: string[];
  priceMin?: number;
  priceMax?: number;
  sizes?: string[];
  colors?: string[];
  discountMin?: number;
  inStock?: boolean;
  isNew?: boolean;
  sort?: SortValue;
  page?: number;
};

type SP = URLSearchParams | Record<string, string | string[] | undefined>;

function all(sp: SP, key: string): string[] {
  if (sp instanceof URLSearchParams) return sp.getAll(key).filter(Boolean);
  const v = sp[key];
  return (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean);
}
const first = (sp: SP, key: string) => all(sp, key)[0];
const num = (v?: string) => {
  const n = v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function parseCatalogQuery(sp: SP): CatalogQuery {
  const dept = first(sp, "department");
  const sort = first(sp, "sort");
  const q: CatalogQuery = {
    department: dept && /^[a-z0-9-]{1,40}$/.test(dept) ? (dept as Department) : undefined,
    q: first(sp, "q")?.slice(0, 80),
    collections: all(sp, "collection").slice(0, 20),
    fabrics: all(sp, "fabric").slice(0, 20),
    occasions: all(sp, "occasion").slice(0, 20),
    priceMin: num(first(sp, "min")),
    priceMax: num(first(sp, "max")),
    sizes: all(sp, "size").slice(0, 20),
    colors: all(sp, "color").slice(0, 20),
    discountMin: num(first(sp, "discount")),
    inStock: first(sp, "stock") === "1",
    isNew: first(sp, "new") === "1",
    sort: SORTS.some((s) => s.value === sort) ? (sort as SortValue) : "featured",
    page: Math.max(1, Math.floor(num(first(sp, "page")) ?? 1)),
  };
  return q;
}

/** Inverse of parseCatalogQuery. Defaults are omitted so URLs stay clean. */
export function toSearchParams(q: CatalogQuery, over: Partial<CatalogQuery> = {}): URLSearchParams {
  const m = { ...q, ...over };
  const sp = new URLSearchParams();
  if (m.department) sp.set("department", m.department);
  if (m.q) sp.set("q", m.q);
  m.collections?.forEach((v) => sp.append("collection", v));
  m.fabrics?.forEach((v) => sp.append("fabric", v));
  m.occasions?.forEach((v) => sp.append("occasion", v));
  if (m.priceMin !== undefined) sp.set("min", String(m.priceMin));
  if (m.priceMax !== undefined) sp.set("max", String(m.priceMax));
  m.sizes?.forEach((v) => sp.append("size", v));
  m.colors?.forEach((v) => sp.append("color", v));
  if (m.discountMin) sp.set("discount", String(m.discountMin));
  if (m.inStock) sp.set("stock", "1");
  if (m.isNew) sp.set("new", "1");
  if (m.sort && m.sort !== "featured") sp.set("sort", m.sort);
  if (m.page && m.page > 1) sp.set("page", String(m.page));
  return sp;
}

export const hasActiveFilters = (q: CatalogQuery) =>
  !!(q.department || q.q || q.collections?.length || q.fabrics?.length || q.occasions?.length || q.priceMin !== undefined ||
    q.priceMax !== undefined || q.sizes?.length || q.colors?.length || q.discountMin || q.inStock || q.isNew);
