import Link from "next/link";
import { ParallaxImage } from "./motion/Parallax";
import { Reveal } from "./motion/Reveal";

/** Shop by Fabric / Occasion promo banners (Figma: category_section_card). They slide in from opposite sides. */
export default function PromoCards() {
  const card = (title: string, href: string, img: string, x: number) => (
    <Reveal x={x} y={0} className="promo-card-wrap">
      <div className="promo-card">
        <div className="promo-card__body">
          <p className="promo-card__title">{title}</p>
          <Link href={href} className="btn">Shop more {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/arrow-up-right.svg" alt="" /></Link>
        </div>
        <ParallaxImage className="promo-card__img" src={img} strength={18} sizes="(max-width: 700px) 50vw, 280px" />
      </div>
    </Reveal>
  );
  return (
    <section className="promo-grid" aria-label="Shop by">
      {card("Shop by Fabric", "/collections/fabric", "/assets/img/shop-fabric.webp", -60)}
      {card("Shop by Occasion", "/collections/occasion", "/assets/img/shop-occasion.webp", 60)}
    </section>
  );
}
