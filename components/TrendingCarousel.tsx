"use client";

import type { Product } from "@/lib/types";
import { useCarousel } from "./useCarousel";
import ProductCard from "./ProductCard";

export default function TrendingCarousel({ products }: { products: Product[] }) {
  const c = useCarousel(products.length);
  return (
    <div className={`trending carousel${c.isStatic ? " is-static" : ""}`}>
      <div className="carousel__track" ref={c.track}>
        {products.map((p) => (
          <div className="carousel__slide" key={p.id}>
            <ProductCard p={p} />
          </div>
        ))}
      </div>
      <div className="carousel__arrows" data-arrow>
        <button type="button" className="arrow-btn" aria-label="Previous" onClick={c.prev}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/chev-left-sm.svg" alt="" /></button>
        <button type="button" className="arrow-btn" aria-label="Next" onClick={c.next}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/chev-right-sm.svg" alt="" /></button>
      </div>
    </div>
  );
}
