import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr, salePrice } from "@/lib/shared";

/** "Trending Looks To Watch" (Figma: reel). */
export default function Reels({ products }: { products: Product[] }) {
  return (
    <div className="reels carousel">
      <div className="carousel__track">
        {products.map((p) => (
          <article className="reel" key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="reel__bg" src={p.images[0]} alt="" loading="lazy" />
            <div className="reel__panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="reel__thumb" src={p.images[0]} alt="" loading="lazy" />
              <div className="reel__info">
                <p className="reel__name">{p.name}</p>
                <p className="reel__price">
                  <span>{inr(salePrice(p))}</span>
                  {p.discountPercent > 0 && <s>{inr(p.mrp)}</s>}
                </p>
                <Link href={`/product/${p.slug}`} className="btn btn--soft">Shop the Look</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
