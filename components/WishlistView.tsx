"use client";

import Link from "next/link";
import ProductCard from "./ProductCard";
import { useStore } from "./Store";

export default function WishlistView() {
  const { ready, catalog, wishlist } = useStore();
  const items = catalog.filter((p) => wishlist.includes(p.id));
  if (!ready || (catalog.length === 0 && wishlist.length > 0)) return <p className="empty">Loading…</p>;
  if (items.length === 0)
    return (
      <div className="empty">
        <p>Your wishlist is empty. Tap the heart on any saree to save it here.</p>
        <Link href="/shop" className="btn btn--primary">Browse sarees</Link>
      </div>
    );
  return <div className="product-grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
