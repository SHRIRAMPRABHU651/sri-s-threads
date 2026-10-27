"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/lib/stats";
import { api } from "./api";
import { downloadCsv, fmtDate, rupees } from "./ui";

export default function CustomersTab() {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { api<Customer[]>("/api/admin/customers").then((r) => r.ok && setRows(r.data)); }, []);
  const list = useMemo(() => (rows ?? []).filter((c) => `${c.name} ${c.mobile} ${c.city}`.toLowerCase().includes(q.trim().toLowerCase())), [rows, q]);
  if (!rows) return <p className="a-mute">Loading…</p>;
  return (
    <>
      <div className="a-head">
        <h2>Customers ({list.length})</h2>
        <button className="a-btn" disabled={!list.length} onClick={() => downloadCsv("customers.csv", [["Name", "Mobile", "City", "Orders", "Total spent", "Last order"], ...list.map((c) => [c.name, c.mobile, c.city, c.orders, c.spent, c.lastOrder])])}>Export CSV</button>
      </div>
      <p className="a-mute">Built automatically from orders — one row per mobile number.</p>
      <div className="a-filter"><input type="search" placeholder="Search name, mobile, city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" /></div>
      <div className="a-list">
        {list.map((c) => (
          <div className="a-row a-row--plain" key={c.mobile}>
            <div className="a-row__main">
              <span className="a-row__title">{c.name}{c.orders > 1 && <span className="a-pill a-pill--warn" style={{ marginLeft: 8 }}>Repeat customer</span>}</span>
              <span className="a-row__meta"><a href={`tel:+91${c.mobile}`}>+91 {c.mobile}</a><span>{c.city}</span><span>{c.orders} order{c.orders === 1 ? "" : "s"}</span><b>{rupees(c.spent)}</b><span>Last: {fmtDate(c.lastOrder)}</span></span>
            </div>
            <div className="a-row__actions"><a className="a-btn a-btn--sm" target="_blank" rel="noreferrer" href={`https://wa.me/91${c.mobile}`}>WhatsApp</a></div>
          </div>
        ))}
        {list.length === 0 && <p className="a-mute">No customers yet.</p>}
      </div>
    </>
  );
}
