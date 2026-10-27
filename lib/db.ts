import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Coupon, DB, Order, Product, Settings, Subscriber } from "./types";
import { buildSeed } from "./seed";

/**
 * Tiny JSON-file database. Perfect for a single-server deployment (VPS, Docker volume, local).
 * On read-only/serverless hosts (e.g. Vercel) swap these functions for a hosted database —
 * every API route and page goes through this module only.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let cache: DB | null = null;
let loading: Promise<DB> | null = null;
// serialise writes so concurrent requests can't clobber each other
let queue: Promise<unknown> = Promise.resolve();

/** Single-flight: concurrent first requests share one load (and one seed write). */
function load(): Promise<DB> {
  if (cache) return Promise.resolve(cache);
  loading ??= (async () => {
    let raw: string | null = null;
    try {
      raw = await fs.readFile(DB_FILE, "utf8");
    } catch (e) {
      // first run: create the seed. Any other read error must surface, never overwrite data.
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
    if (raw === null) {
      cache = buildSeed();
      await persist(cache);
    } else {
      const parsed = JSON.parse(raw) as DB; // a corrupt file throws instead of being reseeded
      // forward-compat for files written by older versions
      parsed.subscribers ??= [];
      parsed.settings = { ...buildSeed().settings, ...parsed.settings };
      cache = parsed;
    }
    return cache as DB;
  })().finally(() => { loading = null; });
  return loading;
}

async function persist(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

/** Run a mutation atomically and save. */
async function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const nowIso = () => new Date().toISOString();

/* ---------------- Products ---------------- */
export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const db = await load();
  const list = opts.includeInactive ? db.products : db.products.filter((p) => p.active);
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProduct(idOrSlug: string): Promise<Product | undefined> {
  const db = await load();
  return db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export async function saveProduct(input: Omit<Product, "id" | "createdAt"> & { id?: string }): Promise<Product> {
  return mutate((db) => {
    const existing = input.id ? db.products.find((p) => p.id === input.id) : undefined;
    // keep slugs unique
    let slug = input.slug;
    let n = 2;
    while (db.products.some((p) => p.slug === slug && p.id !== existing?.id)) slug = `${input.slug}-${n++}`;
    if (existing) {
      Object.assign(existing, input, { slug, id: existing.id, createdAt: existing.createdAt });
      return existing;
    }
    const product: Product = { ...input, slug, id: `p_${randomUUID().slice(0, 8)}`, createdAt: nowIso() };
    db.products.push(product);
    return product;
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    return db.products.length < before;
  });
}

/* ---------------- Coupons ---------------- */
export async function listCoupons(): Promise<Coupon[]> {
  return [...(await load()).coupons].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const c = code.trim().toUpperCase();
  return (await load()).coupons.find((x) => x.code === c);
}

export async function saveCoupon(input: Omit<Coupon, "id" | "createdAt" | "used"> & { id?: string }): Promise<Coupon | { error: string }> {
  return mutate((db) => {
    const code = input.code.trim().toUpperCase();
    const existing = input.id ? db.coupons.find((c) => c.id === input.id) : undefined;
    if (db.coupons.some((c) => c.code === code && c.id !== existing?.id)) return { error: "A coupon with this code already exists." };
    if (existing) {
      Object.assign(existing, input, { code, id: existing.id, used: existing.used, createdAt: existing.createdAt });
      return existing;
    }
    const coupon: Coupon = { ...input, code, id: `c_${randomUUID().slice(0, 8)}`, used: 0, createdAt: nowIso() };
    db.coupons.push(coupon);
    return coupon;
  });
}

export async function deleteCoupon(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.coupons.length;
    db.coupons = db.coupons.filter((c) => c.id !== id);
    return db.coupons.length < before;
  });
}

/* ---------------- Orders ---------------- */
export async function listOrders(): Promise<Order[]> {
  return [...(await load()).orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createOrder(
  build: (db: DB) => Omit<Order, "id" | "number" | "createdAt" | "status"> | { error: string },
): Promise<Order | { error: string }> {
  return mutate((db) => {
    const draft = build(db);
    if ("error" in draft) return draft;
    db.orderSeq += 1;
    const order: Order = {
      ...draft,
      id: `o_${randomUUID().slice(0, 8)}`,
      number: `ST${db.orderSeq}`,
      createdAt: nowIso(),
      status: "new",
    };
    db.orders.push(order);
    if (order.couponCode) {
      const c = db.coupons.find((x) => x.code === order.couponCode);
      if (c) c.used += 1;
    }
    return order;
  });
}

export async function setOrderStatus(id: string, status: Order["status"]): Promise<Order | undefined> {
  return mutate((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (o) o.status = status;
    return o;
  });
}

export async function deleteOrder(id: string): Promise<boolean> {
  return mutate((db) => {
    const before = db.orders.length;
    db.orders = db.orders.filter((o) => o.id !== id);
    return db.orders.length < before;
  });
}

/* ---------------- Settings ---------------- */
export async function getSettings(): Promise<Settings> {
  return (await load()).settings;
}

export async function saveSettings(s: Settings): Promise<Settings> {
  return mutate((db) => {
    db.settings = s;
    return db.settings;
  });
}

/** Read-only snapshot for server components that need several collections. */
export async function snapshot(): Promise<DB> {
  return load();
}

/* ---------------- Newsletter ---------------- */
export async function addSubscriber(email: string): Promise<void> {
  await mutate((db) => {
    const e = email.toLowerCase();
    if (!db.subscribers.some((s) => s.email === e)) db.subscribers.push({ email: e, createdAt: nowIso() });
  });
}

export async function listSubscribers(): Promise<Subscriber[]> {
  return [...(await load()).subscribers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
