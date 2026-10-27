"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { inr, salePrice } from "@/lib/shared";
import { useStore } from "./Store";

/** Product card (Figma: product card_1). */
export default function ProductCard({ p }: { p: Product }) {
  const { add, wishlist, toggleWish, toast } = useStore();
  const router = useRouter();
  const now = salePrice(p);
  const liked = wishlist.includes(p.id);
  const soldOut = p.stock < 1;
  return (
    <article className="product-card">
      <Link href={`/product/${p.slug}`} className="product-card__media" aria-label={p.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.images[0]} alt={p.name} loading="lazy" />
        {p.isNew && (
          <span className="product-card__badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/new-arrow.svg" alt="" /> New
          </span>
        )}
        {p.discountPercent > 0 && <span className="product-card__badge product-card__badge--sale">{Math.round(p.discountPercent)}% OFF</span>}
        {soldOut && <span className="product-card__soldout">Sold out</span>}
      </Link>
      <button
        type="button"
        className={`product-card__like${liked ? " is-liked" : ""}`}
        aria-pressed={liked}
        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => toggleWish(p.id)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icons/heart-sm.svg" alt="" />
      </button>
      <div className="product-card__body">
        <Link href={`/product/${p.slug}`} className="product-card__name">{p.name}</Link>
        <div className="product-card__row">
          <span className="price">
            <span className="price__now">{inr(now)}</span>
            {p.discountPercent > 0 && <s className="price__was">{inr(p.mrp)}</s>}
          </span>
          <button
            type="button"
            className="btn"
            disabled={soldOut}
            onClick={() => {
              if (p.colors.length > 0) return router.push(`/product/${p.slug}`);
              add(p.id);
              toast("Added to bag");
            }}
          >
            Add to bag
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icons/bag-sm.svg" alt="" />
          </button>
        </div>
      </div>
    </article>
  );
}
