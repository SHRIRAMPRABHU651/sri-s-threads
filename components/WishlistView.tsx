"use client";

import Link from "next/link";
import ProductCard from "./ProductCard";
import { useStore } from "./Store";
import { Stagger, StaggerItem } from "./motion/Reveal";

export default function WishlistView() {
  const { ready, loading, wishlist, wishlistProducts } = useStore();
  if (!ready || (wishlist.length > 0 && loading && wishlistProducts.length === 0)) {
    return <div className="product-grid" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--card" />)}</div>;
  }
  if (wishlistProducts.length === 0)
    return (
      <div className="empty">
        <p>Your wishlist is empty. Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn btn--primary">Browse products</Link>
      </div>
    );
  return (
    <Stagger className="product-grid">
      {wishlistProducts.map((p) => <StaggerItem key={p.id}><ProductCard p={p} /></StaggerItem>)}
    </Stagger>
  );
}
