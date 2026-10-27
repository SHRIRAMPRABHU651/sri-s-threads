"use client";

import { useEffect, useState } from "react";
import type { AdminStats } from "@/lib/stats";
import type { OrderStatus } from "@/lib/types";
import { api } from "./api";
import { CountUp, rupees } from "./ui";

const STATUS_LABEL: Record<OrderStatus, string> = { new: "New", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const STATUS_COLOR: Record<OrderStatus, string> = { new: "#29c3c3", confirmed: "#2e90fa", shipped: "#b8975a", delivered: "#12b76a", cancelled: "#f04438" };

function RevenueChart({ daily }: { daily: AdminStats["daily"] }) {
  const [metric, setMetric] = useState<"revenue" | "orders">("revenue");
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 190, padL = 6, padB = 22, top = 14;
  const max = Math.max(1, ...daily.map((d) => d[metric]));
  const bw = (W - padL) / daily.length;
  const total = daily.reduce((s, d) => s + d[metric], 0);
  const h = hover !== null ? daily[hover] : null;
  return (
    <div className="a-card">
      <div className="a-card__head">
        <div>
          <h3>Last 30 days</h3>
          <p className="a-mute">{metric === "revenue" ? rupees(total) : `${total} orders`} {h && <b> · {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: {metric === "revenue" ? rupees(h.revenue) : `${h.orders} orders`}</b>}</p>
        </div>
        <div className="a-seg" role="tablist">
          {(["revenue", "orders"] as const).map((m) => <button key={m} role="tab" aria-selected={metric === m} onClick={() => setMetric(m)}>{m === "revenue" ? "Revenue" : "Orders"}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="a-chart" role="img" aria-label={`Daily ${metric} for the last 30 days`} onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={padL} x2={W} y1={top + (H - top - padB) * (1 - f)} y2={top + (H - top - padB) * (1 - f)} stroke="#e6eeea" strokeWidth="1" />)}
        {daily.map((d, i) => {
          const bh = ((H - top - padB) * d[metric]) / max;
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
              <rect x={padL + i * bw} y={0} width={bw} height={H - padB} fill="transparent" />
              <rect className="a-bar" x={padL + i * bw + bw * 0.16} y={H - padB - bh} width={bw * 0.68} height={Math.max(bh, d[metric] ? 2 : 0)} rx="2" fill={hover === i ? "#b8975a" : "#0c3c3c"} style={{ animationDelay: `${i * 18}ms` }} />
              {i % 5 === 0 && <text x={padL + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#5d6f6c">{new Date(d.date).getDate()}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function OverviewTab({ onGo }: { onGo: (tab: string) => void }) {
  const [s, setS] = useState<AdminStats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api<AdminStats>("/api/admin/stats").then((r) => (r.ok ? setS(r.data) : setErr(r.error))); }, []);
  if (err) return <p className="a-error">{err}</p>;
  if (!s) return <div className="a-stats">{[0, 1, 2, 3].map((i) => <div key={i} className="a-stat a-skel" />)}</div>;

  const totalOrders = Math.max(1, s.orders.all);
  return (
    <>
      <div className="a-stats">
        <div className="a-stat"><b><CountUp value={s.revenue.today} format={rupees} /></b><span>Revenue today</span></div>
        <div className="a-stat"><b><CountUp value={s.revenue.week} format={rupees} /></b><span>Last 7 days</span></div>
        <div className="a-stat"><b><CountUp value={s.revenue.month} format={rupees} /></b><span>Last 30 days</span></div>
        <div className="a-stat"><b><CountUp value={s.orders.averageValue} format={rupees} /></b><span>Average order value</span></div>
      </div>

      {s.orders.byStatus.new > 0 && (
        <button className="a-alert" onClick={() => onGo("orders")}>
          <b>{s.orders.byStatus.new} new {s.orders.byStatus.new === 1 ? "order is" : "orders are"} waiting</b> — open Orders →
        </button>
      )}

      <RevenueChart daily={s.daily} />

      <div className="a-grid2">
        <div className="a-card">
          <h3>Orders by status</h3>
          <div className="a-status-bar" aria-hidden="true">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => s.orders.byStatus[k] > 0 && <i key={k} style={{ width: `${(s.orders.byStatus[k] / totalOrders) * 100}%`, background: STATUS_COLOR[k] }} />)}
          </div>
          <ul className="a-legend">
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((k) => <li key={k}><i style={{ background: STATUS_COLOR[k] }} />{STATUS_LABEL[k]}<b>{s.orders.byStatus[k]}</b></li>)}
          </ul>
        </div>

        <div className="a-card">
          <h3>Best sellers</h3>
          {s.topProducts.length === 0 ? <p className="a-mute">Sales will show up here.</p> : (
            <ol className="a-rank">
              {s.topProducts.map((t) => <li key={t.productId}><span className="a-rank__name">{t.name}</span><span className="a-mute">{t.qty} sold</span><b>{rupees(t.revenue)}</b></li>)}
            </ol>
          )}
        </div>
      </div>

      <div className="a-grid2">
        <div className="a-card">
          <div className="a-card__head"><h3>Low stock</h3><button className="a-btn a-btn--sm" onClick={() => onGo("products")}>Manage</button></div>
          {s.lowStock.length === 0 ? <p className="a-mute">Every product has healthy stock.</p> : (
            <ul className="a-lowstock">
              {s.lowStock.map((p) => (
                <li key={p.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.image && <img src={p.image} alt="" />}
                  <span className="a-rank__name">{p.name}</span>
                  <span className={`a-pill ${p.stock <= 0 ? "a-pill--bad" : "a-pill--warn"}`}>{p.stock <= 0 ? "Out of stock" : `${p.stock} left`}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="a-card">
          <h3>Store at a glance</h3>
          <ul className="a-facts">
            <li><span>Products</span><b>{s.catalog.products}</b></li>
            <li><span>Hidden products</span><b>{s.catalog.hidden}</b></li>
            <li><span>Out of stock</span><b>{s.catalog.outOfStock}</b></li>
            <li><span>Collections</span><b>{s.catalog.collections}</b></li>
            <li><span>Active coupons</span><b>{s.catalog.activeCoupons}</b></li>
            <li><span>Newsletter subscribers</span><b>{s.catalog.subscribers}</b></li>
            <li><span>Lifetime revenue</span><b>{rupees(s.revenue.all)}</b></li>
          </ul>
        </div>
      </div>
    </>
  );
}
