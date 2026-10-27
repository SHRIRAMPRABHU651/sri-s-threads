import Link from "next/link";
import CollectionGrid from "@/components/CollectionGrid";
import HeroCarousel from "@/components/HeroCarousel";
import Reels from "@/components/Reels";
import SectionTitle from "@/components/SectionTitle";
import Testimonials from "@/components/Testimonials";
import TrendingCarousel from "@/components/TrendingCarousel";
import { listProducts } from "@/lib/db";
import { BRAND } from "@/lib/shared";

export default async function HomePage() {
  const products = await listProducts();
  const trending = products.filter((p) => p.trending).slice(0, 12);
  const looks = (trending.length ? trending : products).slice(0, 7);

  return (
    <>
      <HeroCarousel />

      <section className="section">
        <SectionTitle>{BRAND}</SectionTitle>
        <CollectionGrid
          cards={[
            { slug: "saree", label: "Sarees", image: "/assets/img/qala-sarees.webp" },
            { slug: "dress-material", label: "Dress Materials", image: "/assets/img/qala-dress-materials.webp" },
          ]}
          hrefFor={(c) => `/shop?category=${c.slug}`}
          variant="2"
        />
      </section>

      <section className="promo-grid" aria-label="Shop by">
        <div className="promo-card">
          <div className="promo-card__body">
            <p className="promo-card__title">Shop by Fabric</p>
            <Link href="/collections/fabric" className="btn">Shop more <img src="/assets/icons/arrow-up-right.svg" alt="" /></Link>
          </div>
          <div className="promo-card__img"><img src="/assets/img/shop-fabric.webp" alt="" loading="lazy" /></div>
        </div>
        <div className="promo-card">
          <div className="promo-card__body">
            <p className="promo-card__title">Shop by Occasion</p>
            <Link href="/collections/occasion" className="btn">Shop more <img src="/assets/icons/arrow-up-right.svg" alt="" /></Link>
          </div>
          <div className="promo-card__img"><img src="/assets/img/shop-occasion.webp" alt="" loading="lazy" /></div>
        </div>
      </section>

      {trending.length > 0 && (
        <section className="section">
          <SectionTitle>Trending Now</SectionTitle>
          <TrendingCarousel products={trending} />
        </section>
      )}

      {looks.length > 0 && (
        <section className="section">
          <SectionTitle>Trending Looks To Watch</SectionTitle>
          <Reels products={looks} />
        </section>
      )}

      <section className="section">
        <SectionTitle>Love from our community</SectionTitle>
        <Testimonials />
      </section>
    </>
  );
}
