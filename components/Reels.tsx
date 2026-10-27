import Link from "next/link";
import type { Product } from "@/lib/types";
import { inr, salePrice } from "@/lib/shared";
import SmartImg from "./SmartImg";
import { Reveal } from "./motion/Reveal";

/** "Trending Looks To Watch" (Figma: reel). */
export default function Reels({ products }: { products: Product[] }) {
  return (
    <div className="reels carousel">
      <div className="carousel__track">
        {products.map((p, i) => (
            <Reveal key={p.id} className="reel-wrap" delay={Math.min(i, 5) * 0.08} y={36}>
              <article className="reel">
                <SmartImg className="reel__bg" src={p.images[0]} alt="" w={640} sizes="220px" />
                <div className="reel__panel">
                  <SmartImg className="reel__thumb" src={p.images[0]} alt="" w={160} sizes="40px" />
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
            </Reveal>
          ))}
      </div>
    </div>
  );
}
