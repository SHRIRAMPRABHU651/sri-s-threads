export type ProductColor = { name: string; image: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: string;
  care: string;
  mrp: number;
  /** 0-90. Sale price = mrp reduced by this percentage. */
  discountPercent: number;
  images: string[];
  colors: ProductColor[];
  size: string;
  collection: string;
  fabric: string;
  occasion: string;
  stock: number;
  isNew: boolean;
  trending: boolean;
  active: boolean;
  /** ISO date; when set the product page counts down to it. */
  saleEndsAt?: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  /** Cap for percent coupons (0 = no cap). */
  maxDiscount: number;
  active: boolean;
  expiresAt?: string;
  /** 0 = unlimited */
  usageLimit: number;
  used: number;
  createdAt: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  color?: string;
  qty: number;
  price: number;
  mrp: number;
};

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  customer: {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    notes?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  total: number;
  status: OrderStatus;
};

export type Settings = {
  storeName: string;
  /** Digits only, with country code, e.g. 919876543210 */
  whatsappNumber: string;
  announcement: string;
  /** Optional profile links shown in the footer. */
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
};

export type Subscriber = { email: string; createdAt: string };

export type CollectionKind = "collection" | "fabric" | "occasion";

/** A shop-by group (e.g. "Chudidhar", "Silk", "Wedding"). Managed from the admin. */
export type Collection = {
  id: string;
  kind: CollectionKind;
  slug: string;
  name: string;
  image: string;
  /** Collections only: show on the home page "Sri's Threads" section. */
  featured: boolean;
  active: boolean;
  sort: number;
};

export type CartLine = {
  productId: string;
  qty: number;
  color?: string;
};
