import type { Collection, Coupon, Department, Product, Settings } from "./types";
import { slugify } from "./shared";

const now = () => new Date().toISOString();
const img = (n: string) => `/assets/img/${n}.webp`;

const base = {
  details: "Fabric: As described\nSize: Free size\nWork: Woven / printed as shown",
  care: "Dry clean recommended for the first wash.\nStore folded in a cool, dry place away from direct sunlight.\nSlight colour variation may occur due to screen settings and the handmade nature of the weave.",
  sizes: ["Free size"],
  department: "women" as Department,
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
    collection: "sarees",
    fabric: "chanderi",
    occasion: "daily",
    description: "A lightweight Chanderi cotton saree with traditional woven motifs and a contrast border. Soft, breathable and easy to drape for all-day comfort.",
    trending: true,
    isNew: true,
  },
  { name: "Bhakti Silk in Red", mrp: 8000, discountPercent: 38, images: [img("trend-1")], collection: "sarees", fabric: "silk", occasion: "festive", description: "Rich red silk saree with a woven zari border and pallu.", trending: true, isNew: true },
  { name: "Bhakti Silk in Teal and Red", mrp: 8000, discountPercent: 38, images: [img("trend-2")], collection: "sarees", fabric: "silk", occasion: "wedding", description: "Teal silk saree with a red woven pallu and gold motifs.", trending: true, isNew: true },
  { name: "Satin Drape Saree in Mustard Yellow", mrp: 3200, discountPercent: 25, images: [img("trend-3")], collection: "sarees", fabric: "georgette", occasion: "party", description: "A fluid satin-finish drape in warm mustard yellow.", trending: true, isNew: true },
  { name: "Ethnic Motifs Embroidered Sequinned Saree in Purple", mrp: 3500, discountPercent: 14, images: [img("trend-4")], collection: "sarees", fabric: "georgette", occasion: "festive", description: "Deep purple saree with ethnic motif embroidery and sequin work.", trending: true, isNew: true },
  { name: "Bhakti Silk in Crimson", mrp: 8000, discountPercent: 38, images: [img("trend-5")], collection: "sarees", fabric: "silk", occasion: "wedding", description: "Crimson silk saree with a grey woven border.", trending: true, isNew: true },
  { name: "Woven Silk Saree in Emerald Green", mrp: 6500, discountPercent: 30, images: [img("trend-6")], collection: "sarees", fabric: "banarasi", occasion: "wedding", description: "Emerald green silk saree with a multicolour zari border.", trending: true, isNew: true },
  { name: "Floral Print Saree in Ivory and Pink", mrp: 2400, discountPercent: 20, images: [img("trend-7")], collection: "sarees", fabric: "muslin", occasion: "casual", description: "Soft ivory saree with a pink floral print.", trending: true, isNew: true },
];

export function seedProducts(): Product[] {
  return seeds.map((s, i) => ({
    id: `p_${i + 1}`,
    slug: slugify(s.name),
    description: "",
    colors: [],
    ...base,
    ...s,
    createdAt: now(),
  })) as Product[];
}

const col = (kind: Collection["kind"], slug: string, name: string, image: string, sort: number, department: Collection["department"] = "", featured = false): Collection => ({
  id: `${kind}_${slug}`, kind, slug, name, image: img(image), department, featured, active: true, sort,
});

/** Every collection the store ships with. The same list is used for first-run seeding and for the one-time upgrade of older databases. */
export function seedCollections(): Collection[] {
  return [
    // Women
    col("collection", "sarees", "Sarees", "collection-1", 1, "women", true),
    col("collection", "chudidhar", "Chudidhar", "collection-3", 2, "women", true),
    col("collection", "kurtis", "Kurtis", "collection-5", 3, "women", true),
    col("collection", "lehengas", "Lehengas", "collection-6", 4, "women", true),
    col("collection", "anarkali", "Anarkali", "collection-4", 5, "women"),
    col("collection", "dress-materials", "Dress Materials", "collection-2", 6, "women"),
    // Men
    col("collection", "kurtas", "Kurtas", "dept-men", 1, "men", true),
    col("collection", "sherwanis", "Sherwanis", "dept-men", 2, "men", true),
    col("collection", "nehru-jackets", "Nehru Jackets", "dept-men", 3, "men"),
    col("collection", "dhoti-sets", "Dhoti Sets", "dept-men", 4, "men"),
    col("collection", "ethnic-shirts", "Ethnic Shirts", "dept-men", 5, "men"),
    // Kids
    col("collection", "girls-lehengas", "Girls Lehengas", "dept-kids", 1, "kids", true),
    col("collection", "girls-frocks", "Girls Frocks", "dept-kids", 2, "kids", true),
    col("collection", "boys-kurta-sets", "Boys Kurta Sets", "dept-kids", 3, "kids"),
    col("collection", "boys-sherwanis", "Boys Sherwanis", "dept-kids", 4, "kids"),
    col("collection", "kids-festive", "Festive Wear", "dept-kids", 5, "kids"),
    // Accessories
    col("collection", "jewellery", "Jewellery", "dept-accessories", 1, "accessories", true),
    col("collection", "bags-potlis", "Bags & Potlis", "dept-accessories", 2, "accessories", true),
    col("collection", "dupattas-stoles", "Dupattas & Stoles", "dept-accessories", 3, "accessories"),
    col("collection", "footwear", "Footwear", "dept-accessories", 4, "accessories"),
    col("collection", "hair-accessories", "Hair Accessories", "dept-accessories", 5, "accessories"),
    // Shop by fabric (all departments)
    col("fabric", "silk", "Silk", "collection-1", 1),
    col("fabric", "cotton", "Cotton", "collection-2", 2),
    col("fabric", "georgette", "Georgette", "collection-3", 3),
    col("fabric", "muslin", "Muslin", "collection-4", 4),
    col("fabric", "chanderi", "Chanderi", "collection-5", 5),
    col("fabric", "banarasi", "Banarasi", "collection-6", 6),
    col("fabric", "linen", "Linen", "collection-2", 7),
    col("fabric", "velvet", "Velvet", "collection-6", 8),
    // Shop by occasion (all departments)
    col("occasion", "festive", "Festive Wear", "collection-1", 1),
    col("occasion", "wedding", "Wedding Wear", "collection-2", 2),
    col("occasion", "party", "Party Wear", "collection-3", 3),
    col("occasion", "casual", "Casual Wear", "collection-4", 4),
    col("occasion", "office", "Office Wear", "collection-5", 5),
    col("occasion", "daily", "Daily Wear", "collection-6", 6),
  ];
}

export function seedCoupons(): Coupon[] {
  const c = (id: string, code: string, description: string, type: Coupon["type"], value: number, minOrder: number, maxDiscount = 0): Coupon => ({
    id, code, description, type, value, minOrder, maxDiscount, active: true, usageLimit: 0, used: 0, createdAt: now(),
  });
  return [
    c("c_1", "WELCOME20", "*On orders above ₹1,000", "percent", 20, 1000),
    c("c_2", "FESTIVE30", "*On orders above ₹2,500", "percent", 30, 2500, 1500),
    c("c_3", "FLAT200", "*On orders above ₹1,500", "flat", 200, 1500),
  ];
}

export function seedSettings(): Settings {
  return {
    storeName: "Sri's Threads",
    whatsappNumber: (process.env.WHATSAPP_NUMBER || "919999999999").replace(/\D/g, ""),
    announcement: "Get 20% off for first order  . More information here.",
    instagramUrl: "",
    facebookUrl: "",
    twitterUrl: "",
  };
}
