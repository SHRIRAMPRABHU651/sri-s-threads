import "server-only";
import { cloudinaryConfig, environmentName, uploadBuffer, uploadFolder } from "./cloudinary";
import { col, fromDoc, getImage } from "./db";
import type { Collection, Product } from "./types";

export type StorageStatus = {
  provider: "cloudinary" | "mongodb";
  environment: string;
  folder?: string;
  cloudName?: string;
  /** Images still stored in MongoDB and referenced by a product or collection. */
  legacyCount: number;
};

/** Distinct /uploads/… URLs currently referenced by products and collections. */
async function legacyUrls(): Promise<string[]> {
  const [products, collections] = await Promise.all([col("products"), col("collections")]);
  const urls = new Set<string>();
  for (const d of await products.find({ $or: [{ images: /^\/uploads\// }, { "colors.image": /^\/uploads\// }] }).project({ images: 1, colors: 1 }).toArray()) {
    [...(d.images ?? []), ...(d.colors ?? []).map((c: { image: string }) => c.image)].filter((u: string) => u?.startsWith("/uploads/")).forEach((u: string) => urls.add(u));
  }
  for (const d of await collections.find({ image: /^\/uploads\// }).project({ image: 1 }).toArray()) urls.add(d.image);
  return [...urls];
}

export async function storageStatus(): Promise<StorageStatus> {
  const cfg = cloudinaryConfig();
  return {
    provider: cfg ? "cloudinary" : "mongodb",
    environment: environmentName(),
    folder: cfg ? uploadFolder() : undefined,
    cloudName: cfg?.cloudName,
    legacyCount: (await legacyUrls()).length,
  };
}

/** Move up to `limit` MongoDB-stored images to Cloudinary and re-point every reference. Safe to call repeatedly. */
export async function migrateLegacyBatch(limit = 6): Promise<{ moved: number; failed: number; remaining: number }> {
  if (!cloudinaryConfig()) throw new Error("Cloudinary is not configured.");
  const urls = await legacyUrls();
  const [products, collections, images] = await Promise.all([col("products"), col("collections"), col("images")]);
  let moved = 0;
  let failed = 0;
  for (const url of urls.slice(0, limit)) {
    try {
      const img = await getImage(url.slice("/uploads/".length));
      if (!img) { failed++; continue; }
      const next = await uploadBuffer(img.data, img.contentType);
      for (const d of await products.find({ $or: [{ images: url }, { "colors.image": url }] }).toArray()) {
        const p = fromDoc<Product>(d);
        await products.updateOne(
          { _id: d._id },
          { $set: { images: p.images.map((u) => (u === url ? next : u)), colors: p.colors.map((c) => (c.image === url ? { ...c, image: next } : c)) } },
        );
      }
      for (const d of await collections.find({ image: url }).toArray()) {
        await collections.updateOne({ _id: d._id }, { $set: { image: next } satisfies Partial<Collection> });
      }
      await images.deleteOne({ _id: url.slice("/uploads/".length) });
      moved++;
    } catch (e) {
      console.warn("[storage] migrate failed for", url, (e as Error).message);
      failed++;
    }
  }
  return { moved, failed, remaining: Math.max(0, urls.length - moved) };
}
