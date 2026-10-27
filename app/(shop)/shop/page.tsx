import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import { listCollections, listProducts } from "@/lib/db";
import { salePrice } from "@/lib/shared";

export const metadata: Metadata = { title: "All Products" };

type Search = { q?: string; sort?: string; collection?: string; fabric?: string; occasion?: string };

export default async function ShopPage({ searchParams }: { searchParams: Search }) {
  const { q = "", sort = "new", collection, fabric, occasion } = searchParams;
  const [all, groups] = await Promise.all([listProducts(), listCollections()]);
  let list = all;
  if (collection) list = list.filter((p) => p.collection === collection);
  if (fabric) list = list.filter((p) => p.fabric === fabric);
  if (occasion) list = list.filter((p) => p.occasion === occasion);
  if (q.trim()) {
    const t = q.trim().toLowerCase();
    list = list.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(t));
  }
  if (sort === "low") list = [...list].sort((a, b) => salePrice(a) - salePrice(b));
  if (sort === "high") list = [...list].sort((a, b) => salePrice(b) - salePrice(a));

  const label = (kind: string, slug?: string) => groups.find((g) => g.kind === kind && g.slug === slug)?.name ?? slug;
  const current = { collection, fabric, occasion } as Record<string, string | undefined>;
  const href = (over: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const next = { ...current, ...over, q: q || undefined, sort: sort !== "new" ? sort : undefined };
    Object.entries(next).forEach(([k, v]) => v && sp.set(k, v));
    const qs = sp.toString();
    return qs ? `/shop?${qs}` : "/shop";
  };
  const activeLabels = [collection && label("collection", collection), fabric && label("fabric", fabric), occasion && label("occasion", occasion)].filter(Boolean) as string[];
  const tops = groups.filter((g) => g.kind === "collection");

  return (
    <section className="section">
      <SectionTitle as="h1">{activeLabels[0] ?? "All Products"}</SectionTitle>
      <div className="shop-bar" id="search">
        <form action="/shop" method="get">
          {collection && <input type="hidden" name="collection" value={collection} />}
          {fabric && <input type="hidden" name="fabric" value={fabric} />}
          {occasion && <input type="hidden" name="occasion" value={occasion} />}
          <label className="field">
            <img src="/assets/icons/search.svg" alt="" />
            <span className="sr-only">Search products</span>
            <input type="search" name="q" defaultValue={q} placeholder="Search kurtis, sarees, chudidhar…" />
          </label>
          <select className="select" name="sort" defaultValue={sort} aria-label="Sort by">
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <button className="btn btn--primary" type="submit">Search</button>
        </form>
        <div className="chips">
          <Link href="/shop" className={`chip${!collection && !fabric && !occasion && !q ? " chip--active" : ""}`}>All</Link>
          {tops.map((c) => (
            <Link key={c.slug} href={href({ collection: c.slug })} className={`chip${collection === c.slug ? " chip--active" : ""}`}>{c.name}</Link>
          ))}
          {fabric && <Link href={href({ fabric: undefined })} className="chip chip--active" aria-label={`Remove ${label("fabric", fabric)} filter`}>{label("fabric", fabric)} ×</Link>}
          {occasion && <Link href={href({ occasion: undefined })} className="chip chip--active" aria-label={`Remove ${label("occasion", occasion)} filter`}>{label("occasion", occasion)} ×</Link>}
        </div>
        <p className="note">{list.length} {list.length === 1 ? "product" : "products"}</p>
      </div>
      {list.length === 0 ? (
        <div className="empty">
          <p>No products match your search.</p>
          <Link href="/shop" className="btn btn--primary">Clear filters</Link>
        </div>
      ) : (
        <div className="product-grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </section>
  );
}
