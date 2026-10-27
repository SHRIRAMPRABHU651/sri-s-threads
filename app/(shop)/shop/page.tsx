import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import { listProducts } from "@/lib/db";
import { CATEGORIES, FABRICS, OCCASIONS, TOP_COLLECTIONS, salePrice } from "@/lib/shared";

export const metadata: Metadata = { title: "All Products" };

type Search = { q?: string; sort?: string; category?: string; collection?: string; fabric?: string; occasion?: string };

export default async function ShopPage({ searchParams }: { searchParams: Search }) {
  const { q = "", sort = "new", category, collection, fabric, occasion } = searchParams;
  let list = await listProducts();
  if (category) list = list.filter((p) => p.category === category);
  if (collection) list = list.filter((p) => p.collection === collection);
  if (fabric) list = list.filter((p) => p.fabric === fabric);
  if (occasion) list = list.filter((p) => p.occasion === occasion);
  if (q.trim()) {
    const t = q.trim().toLowerCase();
    list = list.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(t));
  }
  if (sort === "low") list = [...list].sort((a, b) => salePrice(a) - salePrice(b));
  if (sort === "high") list = [...list].sort((a, b) => salePrice(b) - salePrice(a));

  const active = [
    category && CATEGORIES.find((c) => c.slug === category)?.label,
    collection && TOP_COLLECTIONS.find((c) => c.slug === collection)?.label,
    fabric && FABRICS.find((c) => c.slug === fabric)?.label,
    occasion && OCCASIONS.find((c) => c.slug === occasion)?.label,
  ].filter(Boolean) as string[];

  return (
    <section className="section">
      <SectionTitle as="h1">{active[0] ?? "All Products"}</SectionTitle>
      <div className="shop-bar" id="search">
        <form action="/shop" method="get">
          {category && <input type="hidden" name="category" value={category} />}
          {collection && <input type="hidden" name="collection" value={collection} />}
          {fabric && <input type="hidden" name="fabric" value={fabric} />}
          {occasion && <input type="hidden" name="occasion" value={occasion} />}
          <label className="field">
            <img src="/assets/icons/search.svg" alt="" />
            <span className="sr-only">Search products</span>
            <input type="search" name="q" defaultValue={q} placeholder="Search sarees…" />
          </label>
          <select className="select" name="sort" defaultValue={sort} aria-label="Sort by">
            <option value="new">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
          <button className="btn btn--primary" type="submit">Search</button>
        </form>
        <div className="chips">
          <Link href="/shop" className={`chip${active.length === 0 && !q ? " chip--active" : ""}`}>All</Link>
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/shop?category=${c.slug}`} className={`chip${category === c.slug ? " chip--active" : ""}`}>{c.label}</Link>
          ))}
          {active.slice(category ? 1 : 0).map((a) => (
            <span key={a} className="chip chip--active">{a}</span>
          ))}
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
