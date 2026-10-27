import "server-only";
import { col } from "./db";
import type { OrderStatus } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const TZ = "Asia/Kolkata";
const day = (field: string) => ({ $dateToString: { format: "%Y-%m-%d", date: { $dateFromString: { dateString: field } }, timezone: TZ } });
const ymd = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // 2026-10-27

export type AdminStats = {
  revenue: { today: number; week: number; month: number; all: number };
  orders: { all: number; today: number; byStatus: Record<OrderStatus, number>; averageValue: number };
  daily: { date: string; orders: number; revenue: number }[]; // last 30 days, gaps filled
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
  lowStock: { id: string; name: string; stock: number; image: string }[];
  catalog: { products: number; hidden: number; outOfStock: number; collections: number; activeCoupons: number; subscribers: number };
};

export async function adminStats(): Promise<AdminStats> {
  const [orders, products, collections, coupons, subscribers] = await Promise.all([col("orders"), col("products"), col("collections"), col("coupons"), col("subscribers")]);
  const live = { status: { $ne: "cancelled" } };
  const since = new Date(Date.now() - 31 * 864e5).toISOString();

  const [byStatus, dailyRows, top, low, totals, pCount, hidden, oos, colCount, cpCount, subCount] = await Promise.all([
    orders.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]).toArray(),
    orders.aggregate([{ $match: { ...live, createdAt: { $gte: since } } }, { $group: { _id: day("$createdAt"), orders: { $sum: 1 }, revenue: { $sum: "$total" } } }]).toArray(),
    orders.aggregate([
      { $match: live },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", name: { $last: "$items.name" }, qty: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.qty", "$items.price"] } } } },
      { $sort: { qty: -1, revenue: -1 } },
      { $limit: 5 },
    ]).toArray(),
    products.find({ active: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).project({ name: 1, stock: 1, images: { $slice: 1 } }).toArray(),
    orders.aggregate([{ $match: live }, { $group: { _id: null, revenue: { $sum: "$total" }, n: { $sum: 1 } } }]).toArray(),
    products.countDocuments({}),
    products.countDocuments({ active: false }),
    products.countDocuments({ active: true, stock: { $lte: 0 } }),
    collections.countDocuments({ active: true }),
    coupons.countDocuments({ active: true }),
    subscribers.countDocuments({}),
  ]);

  const map = new Map<string, { orders: number; revenue: number }>(dailyRows.map((r: any) => [r._id, { orders: r.orders, revenue: r.revenue }]));
  const daily: AdminStats["daily"] = [];
  for (let i = 29; i >= 0; i--) {
    const date = ymd(new Date(Date.now() - i * 864e5));
    daily.push({ date, orders: map.get(date)?.orders ?? 0, revenue: map.get(date)?.revenue ?? 0 });
  }
  const sum = (n: number) => daily.slice(-n).reduce((s, d) => s + d.revenue, 0);
  const statusCounts: Record<OrderStatus, number> = { new: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
  byStatus.forEach((r: any) => { if (r._id in statusCounts) statusCounts[r._id as OrderStatus] = r.n; });
  const all = totals[0]?.revenue ?? 0;
  const count = totals[0]?.n ?? 0;

  return {
    revenue: { today: sum(1), week: sum(7), month: sum(30), all },
    orders: { all: Object.values(statusCounts).reduce((a, b) => a + b, 0), today: daily[daily.length - 1].orders, byStatus: statusCounts, averageValue: count ? Math.round(all / count) : 0 },
    daily,
    topProducts: top.map((t: any) => ({ productId: t._id, name: t.name, qty: t.qty, revenue: t.revenue })),
    lowStock: low.map((p: any) => ({ id: p._id, name: p.name, stock: p.stock, image: p.images?.[0] ?? "" })),
    catalog: { products: pCount, hidden, outOfStock: oos, collections: colCount, activeCoupons: cpCount, subscribers: subCount },
  };
}

export type Customer = { mobile: string; name: string; city: string; orders: number; spent: number; lastOrder: string };

/** One row per mobile number, built from orders (cancelled orders don't count towards spend). */
export async function listCustomers(): Promise<Customer[]> {
  const rows = await (await col("orders"))
    .aggregate([
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: "$customer.mobile",
          name: { $last: "$customer.name" },
          city: { $last: "$customer.city" },
          orders: { $sum: 1 },
          spent: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$total"] } },
          lastOrder: { $max: "$createdAt" },
        },
      },
      { $sort: { spent: -1 } },
      { $limit: 1000 },
    ])
    .toArray();
  return rows.map((r: any) => ({ mobile: r._id, name: r.name, city: r.city, orders: r.orders, spent: r.spent, lastOrder: r.lastOrder }));
}
