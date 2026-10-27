"use client";

import { useCallback, useEffect, useState } from "react";
import type { Collection, Coupon, Order, Product } from "@/lib/types";
import { inr } from "@/lib/shared";
import { Emblem } from "../Logo";
import { api } from "./api";
import CollectionsTab from "./CollectionsTab";
import CouponsTab from "./CouponsTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import SettingsTab from "./SettingsTab";

type Tab = "products" | "collections" | "coupons" | "orders" | "settings";
const TABS: { id: Tab; label: string }[] = [
  { id: "products", label: "Products" },
  { id: "collections", label: "Collections" },
  { id: "coupons", label: "Coupons" },
  { id: "orders", label: "Orders" },
  { id: "settings", label: "Settings" },
];

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Collection[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const [p, g, c, o] = await Promise.all([
      api<Product[]>("/api/products?all=1"),
      api<Collection[]>("/api/collections?all=1"),
      api<Coupon[]>("/api/coupons"),
      api<Order[]>("/api/orders"),
    ]);
    if (p.ok) setProducts(p.data);
    if (g.ok) setGroups(g.data);
    if (c.ok) setCoupons(c.data);
    if (o.ok) setOrders(o.data);
    setLoaded(true);
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const counts: Record<string, number> = {};
  products.forEach((p) => {
    (["collection", "fabric", "occasion"] as const).forEach((k) => { if (p[k]) counts[`${k}:${p[k]}`] = (counts[`${k}:${p[k]}`] ?? 0) + 1; });
  });
  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  return (
    <>
      <header className="a-top">
        <div className="a-top__row">
          <div className="a-top__brand"><Emblem size={30} /> SRI&rsquo;S THREADS · Admin</div>
          <div style={{ display: "flex", gap: 8 }}>
            <a className="a-btn a-btn--sm" href="/" target="_blank" rel="noreferrer">View store</a>
            <button
              className="a-btn a-btn--sm"
              onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/admin/login"; }}
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="a-tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className="a-tab" onClick={() => setTab(t.id)}>
              {t.label}{t.id === "orders" && orders.some((o) => o.status === "new") ? ` (${orders.filter((o) => o.status === "new").length} new)` : ""}
            </button>
          ))}
        </div>
      </header>
      <main className="a-main">
        <div className="a-stats">
          <div className="a-stat"><b>{products.length}</b><span>Products</span></div>
          <div className="a-stat"><b>{coupons.filter((c) => c.active).length}</b><span>Active coupons</span></div>
          <div className="a-stat"><b>{orders.length}</b><span>Orders</span></div>
          <div className="a-stat"><b>{inr(revenue)}</b><span>Order value (excl. cancelled)</span></div>
        </div>
        {!loaded ? <p className="a-mute">Loading…</p> : (
          <>
            {tab === "products" && <ProductsTab products={products} groups={groups} reload={reload} />}
            {tab === "collections" && <CollectionsTab groups={groups} counts={counts} reload={reload} />}
            {tab === "coupons" && <CouponsTab coupons={coupons} reload={reload} />}
            {tab === "orders" && <OrdersTab orders={orders} reload={reload} />}
            {tab === "settings" && <SettingsTab />}
          </>
        )}
      </main>
    </>
  );
}
