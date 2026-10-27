"use client";

import { useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { orderMessage, whatsappUrl } from "@/lib/whatsapp";
import { api } from "./api";
import { downloadCsv, fmtDate, rupees } from "./ui";

const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];
const LABEL: Record<OrderStatus, string> = { new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
type Range = "all" | "today" | "7" | "30";

function printInvoice(o: Order) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return alert("Allow pop-ups to print the invoice.");
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}${[i.color, i.size && `Size ${i.size}`].filter(Boolean).length ? `<br><small>${esc([i.color, i.size && `Size ${i.size}`].filter(Boolean).join(", "))}</small>` : ""}</td><td class="r">${i.qty}</td><td class="r">${rupees(i.price)}</td><td class="r">${rupees(i.price * i.qty)}</td></tr>`).join("");
  w.document.write(`<!doctype html><title>Order ${o.number}</title><style>body{font:14px/1.5 Helvetica,Arial,sans-serif;margin:32px;color:#111}h1{font:600 22px Georgia,serif;margin:0}table{width:100%;border-collapse:collapse;margin-top:18px}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}.tot td{border:0;font-weight:600}small{color:#666}</style>
  <h1>Sri's Threads</h1><p>Order <b>#${o.number}</b> · ${esc(fmtDate(o.createdAt))}</p>
  <p><b>${esc(o.customer.name)}</b><br>+91 ${esc(o.customer.mobile)}<br>${esc(o.customer.address)}, ${esc(o.customer.city)}, ${esc(o.customer.state)} - ${esc(o.customer.pincode)}</p>
  <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr>${rows}
  <tr class="tot"><td colspan="3" class="r">Subtotal</td><td class="r">${rupees(o.subtotal)}</td></tr>
  ${o.discount ? `<tr class="tot"><td colspan="3" class="r">Coupon ${esc(o.couponCode ?? "")}</td><td class="r">−${rupees(o.discount)}</td></tr>` : ""}
  <tr class="tot"><td colspan="3" class="r">Total</td><td class="r">${rupees(o.total)}</td></tr></table>
  <p style="margin-top:32px;color:#666">Thank you for shopping with Sri's Threads.</p><script>window.onload=()=>window.print()</script>`);
  w.document.close();
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export default function OrdersTab({ orders, reload }: { orders: Order[]; reload: () => void }) {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    STATUSES.forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const since = range === "all" ? 0 : range === "today" ? new Date().setHours(0, 0, 0, 0) : Date.now() - Number(range) * 864e5;
    return orders.filter((o) => (filter === "all" || o.status === filter) && new Date(o.createdAt).getTime() >= since &&
      (!t || `${o.number} ${o.customer.name} ${o.customer.mobile} ${o.customer.city}`.toLowerCase().includes(t)));
  }, [orders, filter, q, range]);

  async function setStatus(o: Order, status: OrderStatus) {
    setErr("");
    const r = await api(`/api/orders/${o.id}`, "PATCH", { status });
    if (!r.ok) setErr(r.error);
    reload();
  }
  async function saveNote(o: Order, note: string) {
    if (note === (o.adminNote ?? "")) return;
    await api(`/api/orders/${o.id}`, "PATCH", { adminNote: note });
    reload();
  }
  async function remove(o: Order) {
    if (!confirm(`Delete order #${o.number}?`)) return;
    await api(`/api/orders/${o.id}`, "DELETE");
    reload();
  }

  const exportCsv = () =>
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["Order", "Date", "Status", "Customer", "Mobile", "Address", "City", "State", "Pincode", "Items", "Subtotal", "Coupon", "Discount", "Total", "Notes"],
      ...list.map((o) => [o.number, o.createdAt, o.status, o.customer.name, o.customer.mobile, o.customer.address, o.customer.city, o.customer.state, o.customer.pincode,
        o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} x${i.qty}`).join(" | "), o.subtotal, o.couponCode, o.discount, o.total, o.adminNote]),
    ]);

  return (
    <>
      <div className="a-head"><h2>Orders ({list.length})</h2><button className="a-btn" onClick={exportCsv} disabled={!list.length}>Export CSV</button></div>
      <div className="a-tabs-sub" role="tablist">
        {(["all", ...STATUSES] as const).map((s) => (
          <button key={s} role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}>{s === "all" ? "All" : LABEL[s]} <b>{counts[s] ?? 0}</b></button>
        ))}
      </div>
      <div className="a-filter">
        <input type="search" placeholder="Search order no., name, mobile, city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search orders" />
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Date range">
          <option value="all">All time</option><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
        </select>
      </div>
      {err && <p className="a-error" role="alert">{err}</p>}
      <div className="a-list">
        {list.map((o) => {
          const isOpen = open === o.id;
          return (
            <div className="a-row a-row--plain" key={o.id}>
              <div className="a-row__main">
                <button type="button" className="a-row__toggle" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.id)}>
                  <span className="a-row__title">#{o.number} · {o.customer.name} · {rupees(o.total)}</span>
                  <span className={`a-pill a-pill--${o.status}`}>{LABEL[o.status]}</span>
                </button>
                <span className="a-row__meta"><span>{fmtDate(o.createdAt)}</span><a href={`tel:+91${o.customer.mobile}`}>+91 {o.customer.mobile}</a><span>{o.customer.city}</span><span>{o.items.reduce((s, i) => s + i.qty, 0)} item(s)</span></span>
                {isOpen && (
                  <div className="a-order">
                    <p className="a-mute">{o.customer.address}, {o.customer.city}, {o.customer.state} - {o.customer.pincode}</p>
                    {o.customer.notes && <p className="a-mute">Customer note: {o.customer.notes}</p>}
                    <ul className="a-order__items">
                      {o.items.map((it, i) => (
                        <li key={i}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.image && <img src={it.image} alt="" />}
                          <span>{it.name}{[it.color, it.size && `Size ${it.size}`].filter(Boolean).length ? <small> — {[it.color, it.size && `Size ${it.size}`].filter(Boolean).join(", ")}</small> : null}</span>
                          <span className="a-mute">× {it.qty}</span><b>{rupees(it.price * it.qty)}</b>
                        </li>
                      ))}
                    </ul>
                    {o.discount > 0 && <p className="a-ok">Coupon {o.couponCode}: −{rupees(o.discount)} (subtotal {rupees(o.subtotal)})</p>}
                    <label className="a-note">Private note (only you see this)
                      <textarea defaultValue={o.adminNote ?? ""} onBlur={(e) => saveNote(o, e.target.value)} placeholder="e.g. Paid via UPI, courier AWB…" maxLength={1000} />
                    </label>
                  </div>
                )}
              </div>
              <div className="a-row__actions">
                <select value={o.status} onChange={(e) => setStatus(o, e.target.value as OrderStatus)} aria-label="Order status" className="a-select-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </select>
                <a className="a-btn a-btn--sm" target="_blank" rel="noreferrer" href={whatsappUrl(`91${o.customer.mobile}`, `Hi ${o.customer.name}, this is Sri's Threads regarding your order #${o.number}.\n\n${orderMessage(o)}`)}>WhatsApp</a>
                <button className="a-btn a-btn--sm" onClick={() => printInvoice(o)}>Print</button>
                <button className="a-btn a-btn--sm a-btn--danger" onClick={() => remove(o)}>Delete</button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="a-mute">No orders match. New orders placed from the store appear here.</p>}
      </div>
    </>
  );
}
