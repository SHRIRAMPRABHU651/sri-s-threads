"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DEPARTMENTS, PAGE_SIZE, SORTS, departmentLabel, inr, type SortValue } from "@/lib/shared";
import { hasActiveFilters, toSearchParams, type CatalogQuery } from "@/lib/catalogQuery";
import type { CatalogResult } from "@/lib/catalog";
import type { Collection } from "@/lib/types";
import ProductCard from "../ProductCard";
import { EASE } from "../motion/config";
import { Stagger, StaggerItem } from "../motion/Reveal";
import FilterPanel from "./FilterPanel";
import { useMediaQuery } from "./useMediaQuery";

type Chip = { key: string; label: string; remove: Partial<CatalogQuery> };

function buildChips(q: CatalogQuery, groups: Collection[]): Chip[] {
  const name = (kind: string, slug: string) => groups.find((g) => g.kind === kind && g.slug === slug)?.name ?? slug;
  const chips: Chip[] = [];
  if (q.department) chips.push({ key: "dept", label: departmentLabel(q.department), remove: { department: undefined } });
  if (q.q) chips.push({ key: "q", label: `“${q.q}”`, remove: { q: undefined } });
  q.collections?.forEach((s) => chips.push({ key: `c-${s}`, label: name("collection", s), remove: { collections: q.collections!.filter((x) => x !== s) } }));
  q.fabrics?.forEach((s) => chips.push({ key: `f-${s}`, label: name("fabric", s), remove: { fabrics: q.fabrics!.filter((x) => x !== s) } }));
  q.occasions?.forEach((s) => chips.push({ key: `o-${s}`, label: name("occasion", s), remove: { occasions: q.occasions!.filter((x) => x !== s) } }));
  q.sizes?.forEach((s) => chips.push({ key: `s-${s}`, label: `Size ${s}`, remove: { sizes: q.sizes!.filter((x) => x !== s) } }));
  q.colors?.forEach((s) => chips.push({ key: `col-${s}`, label: s, remove: { colors: q.colors!.filter((x) => x !== s) } }));
  if (q.priceMin !== undefined || q.priceMax !== undefined)
    chips.push({ key: "price", label: `${inr(q.priceMin ?? 0)} – ${q.priceMax !== undefined ? inr(q.priceMax) : "any"}`, remove: { priceMin: undefined, priceMax: undefined } });
  if (q.discountMin) chips.push({ key: "disc", label: `${q.discountMin}% off or more`, remove: { discountMin: undefined } });
  if (q.inStock) chips.push({ key: "stock", label: "In stock", remove: { inStock: false } });
  if (q.isNew) chips.push({ key: "new", label: "New arrivals", remove: { isNew: false } });
  return chips;
}

function pageList(page: number, pages: number): (number | "…")[] {
  const set = new Set([1, pages, page, page - 1, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
}

export default function ShopView({ result, query, groups, title }: { result: CatalogResult; query: CatalogQuery; groups: Collection[]; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState<CatalogQuery>(query);
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [search, setSearch] = useState(query.q ?? "");
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearch(query.q ?? ""); }, [query.q]);
  useEffect(() => { if (!sheet) setDraft(query); }, [query, sheet]);

  const go = useCallback((next: CatalogQuery, opts: { resetPage?: boolean } = { resetPage: true }) => {
    const sp = toSearchParams(next, opts.resetPage === false ? {} : { page: 1 });
    const qs = sp.toString();
    startTransition(() => router.push(qs ? `/shop?${qs}` : "/shop", { scroll: false }));
  }, [router]);

  const apply = (patch: Partial<CatalogQuery>) => go({ ...query, ...patch });

  // mobile sheet: edit a draft, show how many products it would match, apply on confirm
  const draftChange = (patch: Partial<CatalogQuery>) => setDraft((d) => ({ ...d, ...patch }));
  useEffect(() => {
    if (!sheet) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/shop?${toSearchParams(draft, { page: 1 }).toString()}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((d: CatalogResult) => setDraftCount(d.total))
        .catch(() => undefined);
    }, 250);
    return () => { clearTimeout(t); ac.abort(); };
  }, [draft, sheet]);
  useEffect(() => {
    document.body.style.overflow = sheet ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [sheet]);

  const chips = useMemo(() => buildChips(query, groups), [query, groups]);
  const filtered = hasActiveFilters(query);
  const first = (result.page - 1) * PAGE_SIZE + 1;
  const last = Math.min(result.total, result.page * PAGE_SIZE);
  const pageHref = (n: number) => { const qs = toSearchParams(query, { page: n }).toString(); return qs ? `/shop?${qs}` : "/shop"; };
  const clearAll = () => go({ sort: query.sort }, { resetPage: true });
  const activeCount = chips.filter((c) => c.key !== "q").length;

  return (
    <div className="shop" ref={top}>
      <div className="shop__tabs" role="tablist" aria-label="Departments">
        {[{ slug: undefined, label: "All" }, ...DEPARTMENTS].map((d) => (
          <button key={d.slug ?? "all"} role="tab" type="button" aria-selected={query.department === d.slug} className="shop__tab" onClick={() => apply({ department: d.slug, collections: [] })}>{d.label}</button>
        ))}
      </div>

      <div className="shop__bar" id="search">
        <form
          className="shop__search"
          role="search"
          onSubmit={(e) => { e.preventDefault(); apply({ q: search.trim() || undefined }); }}
        >
          <label className="field">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/search.svg" alt="" />
            <span className="sr-only">Search products</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search kurtas, sarees, jewellery…" enterKeyHint="search" />
          </label>
          <button className="btn btn--primary" type="submit">Search</button>
        </form>
        <div className="shop__controls">
          <button type="button" className="btn btn--outline shop__filter-btn" onClick={() => { setDraft(query); setDraftCount(result.total); setSheet(true); }} aria-haspopup="dialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            Filters{activeCount > 0 && <b className="filter-sec__count">{activeCount}</b>}
          </button>
          <label className="sort">
            <span className="sr-only">Sort by</span>
            <select className="select" value={query.sort ?? "featured"} onChange={(e) => apply({ sort: e.target.value as SortValue })} aria-label="Sort by">
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="shop__layout">
        <aside className="shop__side" aria-label="Filters">
          <div className="shop__side-head"><h2>Filters</h2>{filtered && <button type="button" className="link-btn link-btn--brand" onClick={clearAll}>Clear all</button>}</div>
          <FilterPanel query={query} facets={result.facets} groups={groups} onChange={apply} idPrefix="d" />
        </aside>

        <div className="shop__main">
          <div className="shop__head">
            <div>
              <h1 className="shop__title">{title}</h1>
              <p className="note" aria-live="polite">{result.total === 0 ? "No products" : `Showing ${first}–${last} of ${result.total} ${result.total === 1 ? "product" : "products"}`}</p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {chips.length > 0 && (
              <m.div className="chips chips--active" key="chips" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE }}>
                <AnimatePresence initial={false}>
                  {chips.map((c) => (
                    <m.button key={c.key} type="button" className="chip chip--active chip--x" onClick={() => apply(c.remove)} aria-label={`Remove filter ${c.label}`} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}>
                      {c.label} <span aria-hidden="true">×</span>
                    </m.button>
                  ))}
                </AnimatePresence>
                <button type="button" className="link-btn link-btn--brand" onClick={clearAll}>Clear all</button>
              </m.div>
            )}
          </AnimatePresence>

          <div className={`shop__results${pending ? " is-pending" : ""}`} aria-busy={pending}>
            {result.items.length === 0 ? (
              <div className="empty">
                <p>{filtered ? "No products match these filters." : "Products will appear here soon."}</p>
                {filtered && <button type="button" className="btn btn--primary" onClick={clearAll}>Clear filters</button>}
              </div>
            ) : (
              <Stagger className="product-grid product-grid--shop" key={toSearchParams(query).toString()} gap={0.06}>
                {result.items.map((p, i) => <StaggerItem key={p.id}><ProductCard p={p} priority={i < 4} /></StaggerItem>)}
              </Stagger>
            )}
            {pending && <div className="shop__spinner" aria-hidden="true" />}
          </div>

          {result.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {result.page > 1 ? <Link href={pageHref(result.page - 1)} scroll={false} onClick={() => top.current?.scrollIntoView({ behavior: "smooth" })}>← Prev</Link> : <span className="is-disabled">← Prev</span>}
              {pageList(result.page, result.pages).map((n, i) => n === "…" ? <span key={`e${i}`} className="pagination__gap">…</span> : (
                <Link key={n} href={pageHref(n)} scroll={false} aria-current={n === result.page ? "page" : undefined} className={n === result.page ? "is-current" : ""} onClick={() => top.current?.scrollIntoView({ behavior: "smooth" })}>{n}</Link>
              ))}
              {result.page < result.pages ? <Link href={pageHref(result.page + 1)} scroll={false} onClick={() => top.current?.scrollIntoView({ behavior: "smooth" })}>Next →</Link> : <span className="is-disabled">Next →</span>}
            </nav>
          )}
        </div>
      </div>

      {/* mobile / tablet filter sheet */}
      <AnimatePresence>
        {sheet && !isDesktop && (
          <>
            <m.div key="bd" className="sheet-backdrop" onClick={() => setSheet(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
            <m.div key="sh" className="sheet" role="dialog" aria-modal="true" aria-label="Filters" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.4, ease: EASE }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.4 }} onDragEnd={(_, i) => i.offset.y > 120 && setSheet(false)}>
              <div className="sheet__grab" aria-hidden="true" />
              <div className="sheet__head"><h2>Filters</h2><button type="button" className="drawer__close" aria-label="Close filters" onClick={() => setSheet(false)}>&times;</button></div>
              <div className="sheet__body"><FilterPanel query={draft} facets={result.facets} groups={groups} onChange={draftChange} idPrefix="m" /></div>
              <div className="sheet__foot">
                <button type="button" className="btn btn--outline" onClick={() => { setDraft({ sort: draft.sort }); }}>Clear all</button>
                <button type="button" className="btn btn--primary" onClick={() => { setSheet(false); go({ ...draft, page: 1 }); }}>
                  {draftCount === null ? "Show results" : `Show ${draftCount} ${draftCount === 1 ? "product" : "products"}`}
                </button>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
