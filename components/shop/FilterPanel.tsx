"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { DISCOUNT_STEPS, inr } from "@/lib/shared";
import { useDepartments } from "../Departments";
import type { CatalogQuery } from "@/lib/catalogQuery";
import type { CatalogResult } from "@/lib/catalog";
import type { Collection } from "@/lib/types";
import { EASE } from "../motion/config";

type Facets = CatalogResult["facets"];
type Patch = Partial<CatalogQuery>;

function Section({ title, defaultOpen = true, count = 0, children }: { title: string; defaultOpen?: boolean; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="filter-sec">
      <button type="button" className="filter-sec__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{title}{count > 0 && <b className="filter-sec__count">{count}</b>}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .25s" }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE }} style={{ overflow: "hidden" }}>
            <div className="filter-sec__body">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const toggle = (list: string[] | undefined, v: string) => (list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]);

/** Dual-handle price slider (two overlaid range inputs) with number fields. Commits on release / blur. */
function PriceRange({ bounds, min, max, onCommit }: { bounds: { min: number; max: number }; min?: number; max?: number; onCommit: (min?: number, max?: number) => void }) {
  const lo = Math.floor(bounds.min / 100) * 100;
  const hi = Math.max(lo + 100, Math.ceil(bounds.max / 100) * 100);
  const [a, setA] = useState(min ?? lo);
  const [b, setB] = useState(max ?? hi);
  useEffect(() => { setA(min ?? lo); setB(max ?? hi); }, [min, max, lo, hi]);
  const commit = (x: number, y: number) => onCommit(x <= lo ? undefined : x, y >= hi ? undefined : y);
  const pct = (v: number) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div className="price-range">
      <div className="price-range__track" aria-hidden="true"><i style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }} /></div>
      <input type="range" aria-label="Minimum price" min={lo} max={hi} step={50} value={a} onChange={(e) => setA(Math.min(Number(e.target.value), b - 50))} onPointerUp={() => commit(a, b)} onKeyUp={() => commit(a, b)} />
      <input type="range" aria-label="Maximum price" min={lo} max={hi} step={50} value={b} onChange={(e) => setB(Math.max(Number(e.target.value), a + 50))} onPointerUp={() => commit(a, b)} onKeyUp={() => commit(a, b)} />
      <div className="price-range__vals"><span>{inr(a)}</span><span>{inr(b)}{b >= hi ? "+" : ""}</span></div>
    </div>
  );
}

export default function FilterPanel({ query, facets, groups, onChange, idPrefix = "f" }: { query: CatalogQuery; facets: Facets; groups: Collection[]; onChange: (patch: Patch) => void; idPrefix?: string }) {
  const DEPARTMENTS = useDepartments();
  const nameOf = (kind: string, slug: string) => groups.find((g) => g.kind === kind && g.slug === slug)?.name ?? slug;
  const counts = (rows: { name: string; count: number }[]) => new Map(rows.map((r) => [r.name, r.count]));

  const opts = useMemo(() => {
    const build = (kind: "collection" | "fabric" | "occasion", rows: { name: string; count: number }[], selected: string[] = []) => {
      const c = counts(rows);
      // show every active group that has products (or is already ticked), ordered like the admin ordered them
      return groups
        .filter((g) => g.kind === kind && (!query.department || kind !== "collection" || g.department === query.department))
        .filter((g) => (c.get(g.slug) ?? 0) > 0 || selected.includes(g.slug))
        .map((g) => ({ slug: g.slug, name: g.name, count: c.get(g.slug) ?? 0 }));
    };
    return {
      collection: build("collection", facets.collections, query.collections),
      fabric: build("fabric", facets.fabrics, query.fabrics),
      occasion: build("occasion", facets.occasions, query.occasions),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, facets, query.department, query.collections, query.fabrics, query.occasions]);

  const Check = ({ id, label, count, checked, onToggle }: { id: string; label: string; count?: number; checked: boolean; onToggle: () => void }) => (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onToggle} />
      <span className="check__box" aria-hidden="true" />
      <span className="check__label">{label}</span>
      {count !== undefined && <span className="check__count">{count}</span>}
    </label>
  );

  const deptCounts = counts(facets.departments);
  return (
    <div className="filters">
      <Section title="Department" count={query.department ? 1 : 0}>
        <div className="radio-list" role="radiogroup" aria-label="Department">
          <button type="button" role="radio" aria-checked={!query.department} className="radio" onClick={() => onChange({ department: undefined, collections: [] })}><span className="radio__dot" />All departments</button>
          {DEPARTMENTS.map((d) => (
            <button key={d.slug} type="button" role="radio" aria-checked={query.department === d.slug} className="radio" onClick={() => onChange({ department: d.slug, collections: [] })}>
              <span className="radio__dot" />{d.label}<span className="check__count">{deptCounts.get(d.slug) ?? 0}</span>
            </button>
          ))}
        </div>
      </Section>

      {opts.collection.length > 0 && (
        <Section title="Collection" count={query.collections?.length}>
          {opts.collection.map((o) => <Check key={o.slug} id={`${idPrefix}-c-${o.slug}`} label={o.name} count={o.count} checked={!!query.collections?.includes(o.slug)} onToggle={() => onChange({ collections: toggle(query.collections, o.slug) })} />)}
        </Section>
      )}

      {facets.price.max > 0 && (
        <Section title="Price">
          <PriceRange bounds={facets.price} min={query.priceMin} max={query.priceMax} onCommit={(a, b) => onChange({ priceMin: a, priceMax: b })} />
        </Section>
      )}

      {facets.sizes.length > 0 && (
        <Section title="Size" count={query.sizes?.length}>
          <div className="pills">
            {facets.sizes.map((s) => (
              <button key={s.name} type="button" className="size-pill" aria-pressed={!!query.sizes?.includes(s.name)} onClick={() => onChange({ sizes: toggle(query.sizes, s.name) })}>{s.name}</button>
            ))}
          </div>
        </Section>
      )}

      {facets.colors.length > 0 && (
        <Section title="Colour" count={query.colors?.length} defaultOpen={false}>
          {facets.colors.map((c) => <Check key={c.name} id={`${idPrefix}-col-${c.name}`} label={c.name} count={c.count} checked={!!query.colors?.includes(c.name)} onToggle={() => onChange({ colors: toggle(query.colors, c.name) })} />)}
        </Section>
      )}

      {opts.fabric.length > 0 && (
        <Section title="Fabric" count={query.fabrics?.length} defaultOpen={false}>
          {opts.fabric.map((o) => <Check key={o.slug} id={`${idPrefix}-f-${o.slug}`} label={o.name} count={o.count} checked={!!query.fabrics?.includes(o.slug)} onToggle={() => onChange({ fabrics: toggle(query.fabrics, o.slug) })} />)}
        </Section>
      )}

      {opts.occasion.length > 0 && (
        <Section title="Occasion" count={query.occasions?.length} defaultOpen={false}>
          {opts.occasion.map((o) => <Check key={o.slug} id={`${idPrefix}-o-${o.slug}`} label={o.name} count={o.count} checked={!!query.occasions?.includes(o.slug)} onToggle={() => onChange({ occasions: toggle(query.occasions, o.slug) })} />)}
        </Section>
      )}

      <Section title="Discount" count={query.discountMin ? 1 : 0} defaultOpen={false}>
        <div className="radio-list" role="radiogroup" aria-label="Minimum discount">
          <button type="button" role="radio" aria-checked={!query.discountMin} className="radio" onClick={() => onChange({ discountMin: undefined })}><span className="radio__dot" />Any</button>
          {DISCOUNT_STEPS.map((d) => (
            <button key={d} type="button" role="radio" aria-checked={query.discountMin === d} className="radio" onClick={() => onChange({ discountMin: d })}><span className="radio__dot" />{d}% or more</button>
          ))}
        </div>
      </Section>

      <Section title="Availability">
        <Check id={`${idPrefix}-stock`} label="In stock only" checked={!!query.inStock} onToggle={() => onChange({ inStock: !query.inStock })} />
        <Check id={`${idPrefix}-new`} label="New arrivals" checked={!!query.isNew} onToggle={() => onChange({ isNew: !query.isNew })} />
      </Section>
    </div>
  );
}
