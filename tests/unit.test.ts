import { test } from "node:test";
import assert from "node:assert/strict";
import { cloudinaryConfig, environmentName, publicIdFromUrl, signParams, signUpload, uploadFolder } from "../lib/cloudinary";
import { imageSrcSet, isCloudinaryUrl, optimizeImage } from "../lib/imageUrl";
import { parseCatalogQuery, toSearchParams, hasActiveFilters } from "../lib/catalogQuery";
import { evaluateCoupon, salePrice } from "../lib/shared";
import { parseProduct } from "../lib/productInput";
import type { Collection, Coupon } from "../lib/types";

const withEnv = (vars: Record<string, string | undefined>, fn: () => void) => {
  const old: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) { old[k] = process.env[k]; if (vars[k] === undefined) delete process.env[k]; else process.env[k] = vars[k]; }
  try { fn(); } finally { for (const k of Object.keys(old)) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } }
};

/* ---------- Cloudinary ---------- */
test("signParams matches Cloudinary's documented example", () => {
  // from Cloudinary's "Generating authentication signatures" docs
  const sig = signParams({ eager: "w_400,h_300,c_pad|w_260,h_200,c_crop", public_id: "sample_image", timestamp: 1315060510, api_key: "ignored", file: "ignored" }, "abcd");
  assert.equal(sig, "bfd09f95f331f558cbd1320e67aa8d488770583e");
});

test("signParams ignores empty values and sorts keys", () => {
  assert.equal(signParams({ b: "2", a: "1", c: "" , d: undefined }, "s"), signParams({ a: "1", b: "2" }, "s"));
});

test("config: separate vars, CLOUDINARY_URL, and missing", () => {
  withEnv({ CLOUDINARY_CLOUD_NAME: "demo", CLOUDINARY_API_KEY: "k", CLOUDINARY_API_SECRET: "s", CLOUDINARY_URL: undefined }, () => {
    assert.deepEqual(cloudinaryConfig(), { cloudName: "demo", apiKey: "k", apiSecret: "s", apiBase: "https://api.cloudinary.com" });
  });
  withEnv({ CLOUDINARY_CLOUD_NAME: undefined, CLOUDINARY_API_KEY: undefined, CLOUDINARY_API_SECRET: undefined, CLOUDINARY_URL: "cloudinary://111:sec@mycloud" }, () => {
    assert.deepEqual(cloudinaryConfig(), { cloudName: "mycloud", apiKey: "111", apiSecret: "sec", apiBase: "https://api.cloudinary.com" });
  });
  withEnv({ CLOUDINARY_CLOUD_NAME: "demo", CLOUDINARY_API_KEY: undefined, CLOUDINARY_API_SECRET: undefined, CLOUDINARY_URL: undefined }, () => {
    assert.equal(cloudinaryConfig(), null); // partial config = not configured → safe fallback
  });
});

test("environments are isolated: local dev, preview and production use different folders", () => {
  withEnv({ VERCEL: undefined, VERCEL_ENV: undefined, NODE_ENV: "production", CLOUDINARY_FOLDER: undefined }, () => {
    assert.equal(environmentName(), "development"); // even a local `next start` is NOT production
    assert.equal(uploadFolder(), "sris-threads/development");
  });
  withEnv({ VERCEL: "1", VERCEL_ENV: "production", CLOUDINARY_FOLDER: undefined }, () => assert.equal(uploadFolder(), "sris-threads/production"));
  withEnv({ VERCEL: "1", VERCEL_ENV: "preview", CLOUDINARY_FOLDER: undefined }, () => assert.equal(uploadFolder(), "sris-threads/preview"));
  withEnv({ VERCEL: "1", VERCEL_ENV: "production", CLOUDINARY_FOLDER: "/my-shop/" }, () => assert.equal(uploadFolder(), "my-shop/production"));
});

test("signUpload signs exactly the params the browser must send", () => {
  withEnv({ VERCEL: undefined, VERCEL_ENV: undefined }, () => {
    const cfg = { cloudName: "demo", apiKey: "key", apiSecret: "secret", apiBase: "https://api.cloudinary.com" };
    const s = signUpload(cfg);
    assert.equal(s.uploadUrl, "https://api.cloudinary.com/v1_1/demo/image/upload");
    assert.equal(s.params.folder, "sris-threads/development");
    assert.equal(s.signature, signParams(s.params, "secret"));
    assert.ok(!JSON.stringify(s).includes("secret")); // the API secret never leaves the server
  });
});

test("publicIdFromUrl only understands plain delivery URLs of our own cloud", () => {
  const cfg = { cloudName: "demo", apiKey: "k", apiSecret: "s", apiBase: "x" };
  assert.equal(publicIdFromUrl("https://res.cloudinary.com/demo/image/upload/v1700000000/sris-threads/production/abc123.jpg", cfg), "sris-threads/production/abc123");
  assert.equal(publicIdFromUrl("https://res.cloudinary.com/demo/image/upload/sris-threads/production/abc123.webp", cfg), "sris-threads/production/abc123");
  assert.equal(publicIdFromUrl("https://res.cloudinary.com/other/image/upload/v1/x/y.jpg", cfg), null); // someone else's cloud
  assert.equal(publicIdFromUrl("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/x/y.jpg", cfg), null); // has transformations → never guess
  assert.equal(publicIdFromUrl("https://example.com/a.jpg", cfg), null);
  assert.equal(publicIdFromUrl("/uploads/img_abc", cfg), null);
});

/* ---------- delivery URLs ---------- */
test("optimizeImage / imageSrcSet only touch Cloudinary URLs", () => {
  const u = "https://res.cloudinary.com/demo/image/upload/v1/sris-threads/production/a.jpg";
  assert.equal(optimizeImage(u, 600), "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto,c_limit,w_600/v1/sris-threads/production/a.jpg");
  assert.equal(optimizeImage(u), "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,dpr_auto/v1/sris-threads/production/a.jpg");
  assert.ok(imageSrcSet(u)!.includes("w_480") && imageSrcSet(u)!.includes(" 1080w"));
  assert.equal(optimizeImage("/assets/img/a.webp", 600), "/assets/img/a.webp");
  assert.equal(imageSrcSet("/uploads/img_x"), undefined);
  assert.ok(isCloudinaryUrl(u) && !isCloudinaryUrl("/uploads/x"));
});

/* ---------- shop query ---------- */
test("parseCatalogQuery is forgiving and clamps bad input", () => {
  const q = parseCatalogQuery(new URLSearchParams("department=foo&min=abc&page=-3&sort=hack&collection=a&collection=b&stock=1&discount=30"));
  assert.equal(q.department, undefined);
  assert.equal(q.priceMin, undefined);
  assert.equal(q.page, 1);
  assert.equal(q.sort, "featured");
  assert.deepEqual(q.collections, ["a", "b"]);
  assert.equal(q.inStock, true);
  assert.equal(q.discountMin, 30);
});

test("toSearchParams ↔ parseCatalogQuery round-trip and omit defaults", () => {
  const url = "department=men&collection=kurtas&size=M&size=L&color=Red&min=500&max=2500&discount=20&stock=1&new=1&sort=low&page=3&q=silk";
  const q = parseCatalogQuery(new URLSearchParams(url));
  const again = parseCatalogQuery(toSearchParams(q));
  assert.deepEqual(again, q);
  assert.equal(toSearchParams(parseCatalogQuery(new URLSearchParams(""))).toString(), "");
  assert.equal(hasActiveFilters(parseCatalogQuery(new URLSearchParams("sort=low&page=2"))), false);
  assert.equal(hasActiveFilters(q), true);
});

/* ---------- pricing & coupons ---------- */
test("salePrice rounds like the Figma price (1499 @ 23.34% → 1149)", () => {
  assert.equal(salePrice({ mrp: 1499, discountPercent: 23.34 }), 1149);
  assert.equal(salePrice({ mrp: 1000, discountPercent: 0 }), 1000);
});

const coupon = (o: Partial<Coupon>): Coupon => ({ id: "c", code: "X", description: "", type: "percent", value: 20, minOrder: 1000, maxDiscount: 0, active: true, usageLimit: 0, used: 0, createdAt: "", ...o });
test("evaluateCoupon enforces every rule", () => {
  assert.equal(evaluateCoupon(undefined, 5000).ok, false);
  assert.equal(evaluateCoupon(coupon({ active: false }), 5000).ok, false);
  assert.equal(evaluateCoupon(coupon({}), 500).ok, false);
  assert.equal(evaluateCoupon(coupon({ expiresAt: new Date(Date.now() - 1000).toISOString() }), 5000).ok, false);
  assert.equal(evaluateCoupon(coupon({ usageLimit: 2, used: 2 }), 5000).ok, false);
  const ok = evaluateCoupon(coupon({}), 5000);
  assert.ok(ok.ok && ok.discount === 1000);
  const capped = evaluateCoupon(coupon({ maxDiscount: 300 }), 5000);
  assert.ok(capped.ok && capped.discount === 300);
  const flat = evaluateCoupon(coupon({ type: "flat", value: 9999 }), 2000);
  assert.ok(flat.ok && flat.discount === 2000); // never exceeds the subtotal
});

/* ---------- admin input validation ---------- */
const groups: Collection[] = [
  { id: "1", kind: "collection", slug: "kurtas", name: "Kurtas", image: "x", department: "men", featured: true, active: true, sort: 1 },
  { id: "2", kind: "collection", slug: "sarees", name: "Sarees", image: "x", department: "women", featured: true, active: true, sort: 1 },
  { id: "3", kind: "fabric", slug: "silk", name: "Silk", image: "x", department: "", featured: false, active: true, sort: 1 },
];
test("parseProduct: department-aware collection, sizes and clamps", () => {
  const r = parseProduct({ name: "Test", mrp: 1000, discountPercent: 150, images: ["/a.jpg"], department: "men", collection: "kurtas", fabric: "silk", sizes: ["S", "M", "S", ""] }, groups);
  assert.ok(!("error" in r));
  if ("error" in r) return;
  assert.equal(r.department, "men");
  assert.equal(r.collection, "kurtas");
  assert.equal(r.fabric, "silk");
  assert.deepEqual(r.sizes, ["S", "M"]);
  assert.equal(r.discountPercent, 90);
  // a men's product can't be filed under a women's collection
  const bad = parseProduct({ name: "Test", mrp: 1000, images: ["/a.jpg"], department: "men", collection: "sarees" }, groups);
  assert.ok(!("error" in bad) && bad.collection === "");
  assert.ok("error" in parseProduct({ name: "x", mrp: 1000, images: ["/a.jpg"] }, groups));
  assert.ok("error" in parseProduct({ name: "Ok", mrp: 0, images: ["/a.jpg"] }, groups));
  assert.ok("error" in parseProduct({ name: "Ok", mrp: 10, images: [] }, groups));
  const defaults = parseProduct({ name: "Ok", mrp: 10, images: ["/a.jpg"] }, groups);
  assert.ok(!("error" in defaults) && defaults.department === "women" && defaults.sizes[0] === "Free size");
});
