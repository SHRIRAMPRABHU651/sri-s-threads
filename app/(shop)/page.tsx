import DeptCards from "@/components/DeptCards";
import FeaturedTabs from "@/components/FeaturedTabs";
import HeroCarousel from "@/components/HeroCarousel";
import PromoCards from "@/components/PromoCards";
import Reels from "@/components/Reels";
import SectionTitle from "@/components/SectionTitle";
import Testimonials from "@/components/Testimonials";
import TrendingCarousel from "@/components/TrendingCarousel";
import Marquee from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { queryProducts } from "@/lib/catalog";
import { listCollections, listDepartments } from "@/lib/db";
import { BRAND } from "@/lib/shared";

export default async function HomePage() {
  const [{ items }, collections, departments] = await Promise.all([queryProducts({ sort: "featured", page: 1 }), listCollections("collection"), listDepartments()]);
  const trending = items.slice(0, 12);
  const looks = items.slice(0, 7);
  // featured collections first; if none are flagged for a department we still show its first few so tabs are never empty
  const featured = collections.filter((c) => c.featured);

  return (
    <>
      <HeroCarousel />
      <Marquee items={[...departments.map((d) => d.label), "Order on WhatsApp", "New arrivals every week", "Traditional · Ethnic · Elegant"]} />

      <section className="section">
        <SectionTitle eyebrow="Shop by">Department</SectionTitle>
        <DeptCards departments={departments} />
      </section>

      {featured.length > 0 && (
        <section className="section">
          <SectionTitle>{BRAND}</SectionTitle>
          <Reveal y={16}><FeaturedTabs collections={featured} /></Reveal>
        </section>
      )}

      <PromoCards />

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
        <Reveal y={24}><Testimonials /></Reveal>
      </section>
    </>
  );
}
