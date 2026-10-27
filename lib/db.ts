import "server-only";
import { cache } from "react";
import { randomUUID } from "crypto";
import { Binary, MongoClient, type Db } from "mongodb";
import type { Collection, CollectionKind, Coupon, Department, Order, OrderStatus, Product, Settings, Subscriber } from "./types";
import { seedCollections, seedCoupons, seedProducts, seedSettings } from "./seed";
import { destroyByUrl } from "./cloudinary";

/**
 * MongoDB data layer (works on Vercel serverless — no local disk).
 * Documents use the string `id` as Mongo's `_id`; everything outside this file sees plain `{ id, ... }` objects.
 * Product/collection images are stored in the `images` collection and served from /uploads/[id].
 */

type G = typeof globalThis & { _stClient?: Promise<MongoClient>; _stDb?: Promise<Db>; _stDevUri?: Promise<string> };
const g = globalThis as G;

/**
 * Connection string: MONGODB_URI (Atlas) everywhere. For local development only, when it's missing, we start a
 * throwaway-free local MongoDB (data kept in ./.data/mongo) so `npm run dev` works with zero setup.
 */
function resolveUri(): Promise<string> {
  const uri = process.env.MONGODB_URI;
  if (uri) return Promise.resolve(uri);
  if (process.env.NODE_ENV === "production") {
    return Promise.reject(
      new Error("MONGODB_URI is not set. In Vercel: Project → Settings → Environment Variables → add MONGODB_URI (your MongoDB Atlas connection string), then redeploy."),
    );
  }
  g._stDevUri ??= (async () => {
    console.log("[db] MONGODB_URI not set — starting a local development MongoDB (first run downloads the server, ~1 min). Set MONGODB_URI in .env.local to use Atlas instead.");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const { mkdirSync } = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), ".data", "mongo");
    mkdirSync(dbPath, { recursive: true });
    const server = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: "wiredTiger" } });
    return server.getUri();
  })().catch((e) => {
    g._stDevUri = undefined;
    throw new Error(`Could not start the local development database (${(e as Error).message}). Set MONGODB_URI in .env.local to a MongoDB Atlas connection string.`);
  });
  return g._stDevUri;
}

async function getClient(): Promise<MongoClient> {
  // cached on globalThis so dev hot-reloads and warm serverless invocations reuse one connection pool
  g._stClient ??= resolveUri().then((uri) => new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10_000 }).connect());
  return g._stClient;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const toDoc = <T extends { id: string }>(x: T): any => {
  const { id, ...rest } = x;
  return { _id: id, ...rest };
};
export const fromDoc = <T>(d: any): T => {
  const { _id, ...rest } = d;
  return { id: _id, ...rest } as T;
};
const isDup = (e: unknown) => (e as { code?: number })?.code === 11000;
export const newId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;

async function init(d: Db) {
  const c = (name: string) => d.collection<any>(name);
  await Promise.all([
    d.collection("products").createIndex({ slug: 1 }, { unique: true }),
    d.collection("products").createIndex({ createdAt: -1 }),
    d.collection("coupons").createIndex({ code: 1 }, { unique: true }),
    d.collection("collections").createIndex({ kind: 1, slug: 1 }, { unique: true }),
    d.collection("orders").createIndex({ createdAt: -1 }),
    d.collection("login_attempts").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  // First run: seed starter data exactly once (the meta upsert acts as a cross-instance lock).
  const lock = await c("meta").updateOne({ _id: "seed" }, { $setOnInsert: { at: new Date() } }, { upsert: true });
  if (lock.upsertedId) {
    try {
      await Promise.all([
        c("products").insertMany(seedProducts().map(toDoc)),
        c("collections").insertMany(seedCollections().map(toDoc)),
        c("coupons").insertMany(seedCoupons().map(toDoc)),
        c("settings").updateOne({ _id: "main" }, { $setOnInsert: seedSettings() }, { upsert: true }),
      ]);
    } catch (e) {
      await c("meta").deleteOne({ _id: "seed" }); // allow a retry
      throw e;
    }
  }
  await migrate(d);
}

/**
 * One-time, idempotent upgrade of databases created by older versions:
 *   v2 — departments (women/men/kids/accessories), per-product size lists, new department collections.
 * The version claim is atomic, so concurrent serverless instances can't run it twice.
 */
const SCHEMA_VERSION = 2;
async function migrate(d: Db) {
  const c = (name: string) => d.collection<any>(name);
  await c("meta").updateOne({ _id: "schema" }, { $setOnInsert: { v: 0 } }, { upsert: true });
  const claim = await c("meta").updateOne({ _id: "schema", v: { $lt: SCHEMA_VERSION } }, { $set: { v: SCHEMA_VERSION, at: new Date() } });
  if (claim.modifiedCount !== 1) return;
  try {
    await c("products").updateMany({ department: { $exists: false } }, { $set: { department: "women" } });
    await c("products").updateMany({ sizes: { $exists: false } }, [
      { $set: { sizes: { $cond: [{ $and: [{ $eq: [{ $type: "$size" }, "string"] }, { $ne: ["$size", ""] }] }, ["$size"], ["Free size"]] } } },
      { $unset: "size" },
    ]);
    await c("collections").updateMany({ department: { $exists: false }, kind: "collection" }, { $set: { department: "women" } });
    await c("collections").updateMany({ department: { $exists: false } }, { $set: { department: "" } });
    for (const col of seedCollections()) {
      const { id, ...rest } = col;
      await c("collections").updateOne({ kind: col.kind, slug: col.slug }, { $setOnInsert: { _id: id, ...rest } }, { upsert: true });
    }
  } catch (e) {
    await c("meta").updateOne({ _id: "schema" }, { $set: { v: 0 } }); // let the next start retry
    throw e;
  }
}

async function db(): Promise<Db> {
  g._stDb ??= (async () => {
    const client = await getClient();
    const d = client.db(process.env.MONGODB_DB || "sris-threads");
    await init(d);
    return d;
  })().catch((e) => {
    g._stDb = undefined;
    g._stClient = undefined;
    throw e;
  });
  return g._stDb;
}

export const col = async (name: string) => (await db()).collection<any>(name);

/* ---------------- Images (stored in MongoDB) ---------------- */
export async function saveImage(data: Buffer, contentType: string): Promise<string> {
  const id = newId("img");
  await (await col("images")).insertOne({ _id: id, contentType, size: data.length, data: new Binary(data), createdAt: new Date() });
  return `/uploads/${id}`;
}

export async function getImage(id: string): Promise<{ contentType: string; data: Buffer } | null> {
  const doc = await (await col("images")).findOne({ _id: id });
  return doc ? { contentType: doc.contentType, data: Buffer.from(doc.data.buffer) } : null;
}

/** Remove one stored image from wherever it lives (MongoDB fallback store, or this environment's Cloudinary folder). */
async function deleteStoredImage(url: string) {
  if (url.startsWith("/uploads/")) {
    await (await col("images")).deleteOne({ _id: url.slice("/uploads/".length) });
  } else if (url.startsWith("https://res.cloudinary.com/")) {
    try {
      await destroyByUrl(url);
    } catch (e) {
      console.warn("[images] Cloudinary delete failed:", (e as Error).message); // never block a save/delete on cleanup
    }
  }
}

/** Delete uploaded images that nothing references any more (keeps storage tidy and free tiers from filling up). */
export async function pruneImages(urls: string[]) {
  const candidates = [...new Set(urls)].filter((u) => u.startsWith("/uploads/") || u.startsWith("https://res.cloudinary.com/"));
  if (!candidates.length) return;
  const [products, collections] = await Promise.all([col("products"), col("collections")]);
  for (const url of candidates) {
    const used =
      (await products.countDocuments({ $or: [{ images: url }, { "colors.image": url }] }, { limit: 1 })) +
      (await collections.countDocuments({ image: url }, { limit: 1 }));
    if (!used) await deleteStoredImage(url);
  }
}
const productImages = (p: Pick<Product, "images" | "colors">) => [...(p.images ?? []), ...(p.colors ?? []).map((c) => c.image)];

/* ---------------- Products ---------------- */
export async function listProducts(opts: { includeInactive?: boolean } = {}): Promise<Product[]> {
  const docs = await (await col("products")).find(opts.includeInactive ? {} : { active: true }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => fromDoc<Product>(d));
}

export async function getProduct(idOrSlug: string): Promise<Product | undefined> {
  const d = await (await col("products")).findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] });
  return d ? fromDoc<Product>(d) : undefined;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const docs = await (await col("products")).find({ _id: { $in: ids } }).toArray();
  return docs.map((d) => fromDoc<Product>(d));
}

export async function saveProduct(input: Omit<Product, "id" | "createdAt"> & { id?: string }): Promise<Product> {
  const products = await col("products");
  const existing = input.id ? await products.findOne({ _id: input.id }) : null;
  let slug = input.slug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { id: _ignored, ...fields } = input;
    void _ignored;
    try {
      if (existing) {
        await products.updateOne({ _id: existing._id }, { $set: { ...fields, slug } });
        const saved = fromDoc<Product>({ ...existing, ...fields, slug });
        await pruneImages(productImages(fromDoc<Product>(existing)));
        return saved;
      }
      const product: Product = { ...fields, slug, id: newId("p"), createdAt: new Date().toISOString() };
      await products.insertOne(toDoc(product));
      return product;
    } catch (e) {
      if (!isDup(e)) throw e;
      slug = `${input.slug}-${randomUUID().slice(0, 4)}`; // slug taken → make it unique
    }
  }
  throw new Error("Could not generate a unique slug.");
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await col("products");
  const doc = await products.findOne({ _id: id });
  if (!doc) return false;
  await products.deleteOne({ _id: id });
  await pruneImages(productImages(fromDoc<Product>(doc)));
  return true;
}

export async function duplicateProduct(id: string): Promise<Product | undefined> {
  const src = await getProduct(id);
  if (!src) return undefined;
  const { id: _id, createdAt: _c, slug, name, ...rest } = src;
  void _id; void _c;
  return saveProduct({ ...rest, name: `${name} (Copy)`, slug: `${slug}-copy`, active: false, sku: undefined });
}

export type BulkAction =
  | { action: "activate" | "deactivate" | "delete" }
  | { action: "discount"; percent: number }
  | { action: "department"; department: Department }
  | { action: "collection" | "fabric" | "occasion"; value: string }
  | { action: "trending" | "isNew"; value: boolean }
  | { action: "stock"; value: number };

/** Apply one change to many products at once. Returns how many were affected. */
export async function bulkUpdateProducts(ids: string[], op: BulkAction): Promise<number> {
  const products = await col("products");
  const filter = { _id: { $in: ids } };
  switch (op.action) {
    case "delete": {
      const docs = await products.find(filter).toArray();
      const res = await products.deleteMany(filter);
      await pruneImages(docs.flatMap((d) => productImages(fromDoc<Product>(d))));
      return res.deletedCount;
    }
    case "activate":
    case "deactivate":
      return (await products.updateMany(filter, { $set: { active: op.action === "activate" } })).matchedCount;
    case "discount":
      return (await products.updateMany(filter, { $set: { discountPercent: Math.min(90, Math.max(0, op.percent)) } })).matchedCount;
    case "department":
      return (await products.updateMany(filter, { $set: { department: op.department } })).matchedCount;
    case "collection":
    case "fabric":
    case "occasion":
      return (await products.updateMany(filter, { $set: { [op.action]: op.value } })).matchedCount;
    case "trending":
    case "isNew":
      return (await products.updateMany(filter, { $set: { [op.action]: op.value } })).matchedCount;
    case "stock":
      return (await products.updateMany(filter, { $set: { stock: Math.max(0, Math.round(op.value)) } })).matchedCount;
  }
}

/* ---------------- Collections (admin-managed shop-by groups) ---------------- */
export async function listCollections(kind?: CollectionKind, opts: { includeInactive?: boolean; department?: Department } = {}): Promise<Collection[]> {
  const filter: any = {};
  if (kind) filter.kind = kind;
  if (opts.department) filter.department = { $in: [opts.department, ""] };
  if (!opts.includeInactive) filter.active = true;
  const docs = await (await col("collections")).find(filter).sort({ sort: 1, name: 1 }).toArray();
  return docs.map((d) => fromDoc<Collection>(d));
}

export async function saveCollection(input: Omit<Collection, "id"> & { id?: string }): Promise<Collection | { error: string }> {
  const collections = await col("collections");
  try {
    if (input.id) {
      const existing = await collections.findOne({ _id: input.id });
      if (!existing) return { error: "Collection not found." };
      // kind + slug are fixed after creation so products keep pointing at the right group
      const { id, kind: _k, slug: _s, ...rest } = input;
      void _k; void _s;
      await collections.updateOne({ _id: id }, { $set: rest });
      if (existing.image !== input.image) await pruneImages([existing.image]);
      return fromDoc<Collection>({ ...existing, ...rest });
    }
    const created: Collection = { ...input, id: newId("col") };
    await collections.insertOne(toDoc(created));
    return created;
  } catch (e) {
    if (isDup(e)) return { error: "A collection with this name already exists in this group." };
    throw e;
  }
}

export async function deleteCollection(id: string): Promise<boolean> {
  const collections = await col("collections");
  const doc = await collections.findOne({ _id: id });
  if (!doc) return false;
  await collections.deleteOne({ _id: id });
  // detach products from the removed group
  await (await col("products")).updateMany({ [doc.kind]: doc.slug }, { $set: { [doc.kind]: "" } });
  await pruneImages([doc.image]);
  return true;
}

/* ---------------- Coupons ---------------- */
export async function listCoupons(): Promise<Coupon[]> {
  const docs = await (await col("coupons")).find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => fromDoc<Coupon>(d));
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const d = await (await col("coupons")).findOne({ code: code.trim().toUpperCase() });
  return d ? fromDoc<Coupon>(d) : undefined;
}

export async function saveCoupon(input: Omit<Coupon, "id" | "createdAt" | "used"> & { id?: string }): Promise<Coupon | { error: string }> {
  const coupons = await col("coupons");
  const code = input.code.trim().toUpperCase();
  try {
    if (input.id) {
      const existing = await coupons.findOne({ _id: input.id });
      if (!existing) return { error: "Coupon not found." };
      const { id, ...rest } = input;
      await coupons.updateOne({ _id: id }, { $set: { ...rest, code } });
      return fromDoc<Coupon>({ ...existing, ...rest, code });
    }
    const coupon: Coupon = { ...input, code, id: newId("c"), used: 0, createdAt: new Date().toISOString() };
    await coupons.insertOne(toDoc(coupon));
    return coupon;
  } catch (e) {
    if (isDup(e)) return { error: "A coupon with this code already exists." };
    throw e;
  }
}

export async function deleteCoupon(id: string): Promise<boolean> {
  return (await (await col("coupons")).deleteOne({ _id: id })).deletedCount > 0;
}

/** Atomically claim one use of a coupon (respects the usage limit). */
export async function reserveCoupon(code: string): Promise<boolean> {
  const r = await (await col("coupons")).updateOne(
    { code, active: true, $or: [{ usageLimit: 0 }, { $expr: { $lt: ["$used", "$usageLimit"] } }] },
    { $inc: { used: 1 } },
  );
  return r.modifiedCount === 1;
}
export async function releaseCoupon(code: string) {
  await (await col("coupons")).updateOne({ code, used: { $gt: 0 } }, { $inc: { used: -1 } });
}

/* ---------------- Stock ---------------- */
type StockLine = { productId: string; qty: number };
const byProduct = (lines: StockLine[]) => {
  const m = new Map<string, number>();
  lines.forEach((l) => m.set(l.productId, (m.get(l.productId) ?? 0) + l.qty));
  return [...m];
};

/** Atomically take stock for every line, or take nothing. Returns the product id that was short, if any. */
export async function reserveStock(lines: StockLine[]): Promise<{ ok: true } | { ok: false; productId: string }> {
  const products = await col("products");
  const done: [string, number][] = [];
  for (const [id, qty] of byProduct(lines)) {
    const r = await products.updateOne({ _id: id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
    if (r.modifiedCount !== 1) {
      for (const [pid, q] of done) await products.updateOne({ _id: pid }, { $inc: { stock: q } });
      return { ok: false, productId: id };
    }
    done.push([id, qty]);
  }
  return { ok: true };
}
export async function releaseStock(lines: StockLine[]) {
  const products = await col("products");
  for (const [id, qty] of byProduct(lines)) await products.updateOne({ _id: id }, { $inc: { stock: qty } });
}

/* ---------------- Orders ---------------- */
export async function listOrders(): Promise<Order[]> {
  const docs = await (await col("orders")).find({}).sort({ createdAt: -1 }).limit(500).toArray();
  return docs.map((d) => fromDoc<Order>(d));
}

export async function insertOrder(draft: Omit<Order, "id" | "number" | "createdAt" | "status">): Promise<Order> {
  const counter = await (await col("counters")).findOneAndUpdate({ _id: "orders" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  const order: Order = {
    ...draft,
    id: newId("o"),
    number: `ST${1000 + (counter?.seq ?? 1)}`,
    createdAt: new Date().toISOString(),
    status: "new",
  };
  await (await col("orders")).insertOne(toDoc(order));
  return order;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | { error: string } | undefined> {
  const orders = await col("orders");
  const doc = await orders.findOne({ _id: id });
  if (!doc) return undefined;
  const order = fromDoc<Order>(doc);
  const lines = order.items.map((i) => ({ productId: i.productId, qty: i.qty }));
  if (status === "cancelled" && order.status !== "cancelled") await releaseStock(lines);
  if (order.status === "cancelled" && status !== "cancelled") {
    const r = await reserveStock(lines);
    if (!r.ok) return { error: "Not enough stock to re-activate this order." };
  }
  await orders.updateOne({ _id: id }, { $set: { status } });
  return { ...order, status };
}

export async function setOrderNote(id: string, note: string): Promise<boolean> {
  return (await (await col("orders")).updateOne({ _id: id }, { $set: { adminNote: note.slice(0, 1000) } })).matchedCount === 1;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const orders = await col("orders");
  const doc = await orders.findOne({ _id: id });
  if (!doc) return false;
  const order = fromDoc<Order>(doc);
  // an order that never shipped gives its stock back
  if (order.status === "new" || order.status === "confirmed")
    await releaseStock(order.items.map((i) => ({ productId: i.productId, qty: i.qty })));
  await orders.deleteOne({ _id: id });
  return true;
}

/* ---------------- Settings ---------------- */
export const getSettings = cache(async (): Promise<Settings> => {
  const doc = await (await col("settings")).findOne({ _id: "main" });
  const { _id, ...rest } = doc ?? ({} as any);
  void _id;
  return { ...seedSettings(), ...rest } as Settings;
});

export async function saveSettings(s: Settings): Promise<Settings> {
  await (await col("settings")).updateOne({ _id: "main" }, { $set: s }, { upsert: true });
  return s;
}

/* ---------------- Newsletter ---------------- */
export async function addSubscriber(email: string): Promise<void> {
  await (await col("subscribers")).updateOne({ _id: email.toLowerCase() }, { $setOnInsert: { createdAt: new Date().toISOString() } }, { upsert: true });
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const docs = await (await col("subscribers")).find({}).sort({ createdAt: -1 }).limit(1000).toArray();
  return docs.map((d) => ({ email: d._id, createdAt: d.createdAt }));
}

/* ---------------- Admin login throttle (shared across serverless instances) ---------------- */
const MAX_FAILS = 6;
const WINDOW_MS = 15 * 60_000;

export async function isLoginBlocked(key: string): Promise<boolean> {
  const d = await (await col("login_attempts")).findOne({ _id: key });
  return !!d && d.resetAt > new Date() && d.n >= MAX_FAILS;
}
export async function recordLoginFailure(key: string) {
  const attempts = await col("login_attempts");
  const d = await attempts.findOne({ _id: key });
  if (d && d.resetAt > new Date()) await attempts.updateOne({ _id: key }, { $inc: { n: 1 } });
  else await attempts.updateOne({ _id: key }, { $set: { n: 1, resetAt: new Date(Date.now() + WINDOW_MS) } }, { upsert: true });
}
export async function clearLoginFailures(key: string) {
  await (await col("login_attempts")).deleteOne({ _id: key });
}
