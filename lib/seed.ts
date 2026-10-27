import type { DB, Product } from "./types";
import { slugify } from "./shared";

const now = () => new Date().toISOString();
const img = (n: string) => `/assets/img/${n}.webp`;

const base = {
  details: "Fabric: As described\nSize: Free size (saree 5.5 m + unstitched blouse piece)\nWork: Woven / printed as shown",
  care: "Dry clean recommended for the first wash.\nStore folded in a cool, dry place away from direct sunlight.\nSlight colour variation may occur due to screen settings and the handmade nature of the weave.",
  size: "Free size",
  category: "saree" as const,
  stock: 25,
  active: true,
};

type Seed = Partial<Product> & Pick<Product, "name" | "mrp" | "discountPercent" | "images" | "collection" | "fabric" | "occasion">;

const seeds: Seed[] = [
  {
    name: "Woven Design Chanderi Cotton Saree with Red Motifs",
    mrp: 1499,
    discountPercent: 23.34,
    images: [img("product-main"), img("product-2"), img("product-3"), img("product-4"), img("product-5")],
    colors: [
      { name: "Red", image: img("product-2") },
      { name: "Black", image: img("product-3") },
      { name: "Teal", image: img("product-4") },
      { name: "Charcoal", image: img("product-5") },
    ],
    collection: "cotton-classic",
    fabric: "chanderi",
    occasion: "daily",
    description: "A lightweight Chanderi cotton saree with traditional woven motifs and a contrast border. Soft, breathable and easy to drape for all-day comfort.",
    trending: true,
    isNew: true,
  },
  { name: "Bhakti Silk in Red", mrp: 8000, discountPercent: 38, images: [img("trend-1")], collection: "silk-sarees", fabric: "silk", occasion: "festive", description: "Rich red silk saree with a woven zari border and pallu.", trending: true, isNew: true },
  { name: "Bhakti Silk in Teal and Red", mrp: 8000, discountPercent: 38, images: [img("trend-2")], collection: "silk-sarees", fabric: "silk", occasion: "wedding", description: "Teal silk saree with a red woven pallu and gold motifs.", trending: true, isNew: true },
  { name: "Satin Drape Saree in Mustard Yellow", mrp: 3200, discountPercent: 25, images: [img("trend-3")], collection: "pure-georgette", fabric: "georgette", occasion: "party", description: "A fluid satin-finish drape in warm mustard yellow.", trending: true, isNew: true },
  { name: "Ethnic Motifs Embroidered Sequinned Saree in Purple", mrp: 3500, discountPercent: 14, images: [img("trend-4")], collection: "festive-wear", fabric: "georgette", occasion: "festive", description: "Deep purple saree with ethnic motif embroidery and sequin work.", trending: true, isNew: true },
  { name: "Bhakti Silk in Crimson", mrp: 8000, discountPercent: 38, images: [img("trend-5")], collection: "wedding-sarees", fabric: "silk", occasion: "wedding", description: "Crimson silk saree with a grey woven border.", trending: true, isNew: true },
  { name: "Woven Silk Saree in Emerald Green", mrp: 6500, discountPercent: 30, images: [img("trend-6")], collection: "silk-sarees", fabric: "banarasi", occasion: "wedding", description: "Emerald green silk saree with a multicolour zari border.", trending: true, isNew: true },
  { name: "Floral Print Saree in Ivory and Pink", mrp: 2400, discountPercent: 20, images: [img("trend-7")], collection: "pure-muslin", fabric: "muslin", occasion: "casual", description: "Soft ivory saree with a pink floral print.", trending: true, isNew: true },
];

export function buildSeed(): DB {
  const products: Product[] = seeds.map((s, i) => ({
    id: `p_${i + 1}`,
    slug: slugify(s.name),
    description: "",
    colors: [],
    ...base,
    ...s,
    createdAt: now(),
  })) as Product[];

  return {
    products,
    orderSeq: 1000,
    subscribers: [],
    orders: [],
    coupons: [
      { id: "c_1", code: "WELCOME20", description: "*On orders above ₹1,000", type: "percent", value: 20, minOrder: 1000, maxDiscount: 0, active: true, usageLimit: 0, used: 0, createdAt: now() },
      { id: "c_2", code: "FESTIVE30", description: "*On orders above ₹2,500", type: "percent", value: 30, minOrder: 2500, maxDiscount: 1500, active: true, usageLimit: 0, used: 0, createdAt: now() },
      { id: "c_3", code: "FLAT200", description: "*On orders above ₹1,500", type: "flat", value: 200, minOrder: 1500, maxDiscount: 0, active: true, usageLimit: 0, used: 0, createdAt: now() },
    ],
    settings: {
      storeName: "Sri's Threads",
      whatsappNumber: process.env.WHATSAPP_NUMBER || "919999999999",
      announcement: "Get 20% off for first order  . More information here.",
      instagramUrl: "",
      facebookUrl: "",
      twitterUrl: "",
    },
  };
}
