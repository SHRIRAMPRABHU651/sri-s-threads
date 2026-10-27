"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { inr } from "@/lib/shared";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";
import { api } from "./api";

const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrdersTab({ orders, reload }: { orders: Order[]; reload: () => void }) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const list = orders.filter((o) => filter === "all" || o.status === filter);

  async function setStatus(o: Order, status: OrderStatus) {
    await api(`/api/orders/${o.id}`, "PATCH", { status });
    reload();
  }
  async function remove(o: Order) {
    if (!confirm(`Delete order #${o.number}?`)) return;
    await api(`/api/orders/${o.id}`, "DELETE");
    reload();
  }

  return (
    <>
      <div className="a-head"><h2>Orders ({orders.length})</h2></div>
      <div className="a-filter">
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className="a-list">
        {list.map((o) => (
          <div className="a-row a-row--plain" key={o.id}>
            <div className="a-row__main">
              <span className="a-row__title">#{o.number} · {o.customer.name} · {inr(o.total)}</span>
              <span className="a-row__meta">
                <span>{new Date(o.createdAt).toLocaleString()}</span>
                <a href={`tel:+91${o.customer.mobile}`}>+91 {o.customer.mobile}</a>
              </span>
              <span className="a-mute">{o.customer.address}, {o.customer.city}, {o.customer.state} - {o.customer.pincode}</span>
              {o.customer.notes && <span className="a-mute">Note: {o.customer.notes}</span>}
              <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                {o.items.map((it, i) => <li key={i}>{it.name}{it.color ? ` (${it.color})` : ""} × {it.qty} — {inr(it.price * it.qty)}</li>)}
              </ul>
              {o.discount > 0 && <span className="a-ok">Coupon {o.couponCode}: −{inr(o.discount)} (subtotal {inr(o.subtotal)})</span>}
            </div>
            <div className="a-row__actions">
              <select value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)} aria-label="Order status" style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid var(--a-line)" }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </select>
              <a className="a-btn a-btn--sm" target="_blank" rel="noreferrer" href={whatsappUrl(`91${o.customer.mobile}`, `Hi ${o.customer.name}, this is Sri's Threads regarding your order #${o.number}.\n\n${orderMessage(o)}`)}>WhatsApp customer</a>
              <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(o)}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="a-mute">No orders yet. New orders placed from the store appear here.</p>}
      </div>
    </>
  );
}
