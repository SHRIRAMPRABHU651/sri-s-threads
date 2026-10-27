import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionGrid from "@/components/CollectionGrid";
import SectionTitle from "@/components/SectionTitle";
import TrendingCarousel from "@/components/TrendingCarousel";
import ProductCard from "@/components/ProductCard";
import { ParallaxBlock } from "@/components/motion/Parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import SmartImg from "@/components/SmartImg";
import { queryProducts } from "@/lib/catalog";
import { getSettings, listCollections } from "@/lib/db";
import { DEPARTMENTS, isDepartment } from "@/lib/shared";
import { whatsappUrl } from "@/lib/whatsapp";

export function generateMetadata({ params }: { params: { department: string } }): Metadata {
  const d = DEPARTMENTS.find((x) => x.slug === params.department);
  return d ? { title: `${d.label}'s Ethnic Wear`.replace("Women's", "Women's").replace("Accessories's", "Accessories"), description: d.blurb } : { title: "Not found" };
}

export default async function DepartmentPage({ params }: { params: { department: string } }) {
  if (!isDepartment(params.department)) notFound();
  const dept = DEPARTMENTS.find((d) => d.slug === params.department)!;
  const [collections, fresh, popular, settings] = await Promise.all([
    listCollections("collection", { department: dept.slug }),
    queryProducts({ department: dept.slug, sort: "new", page: 1 }),
    queryProducts({ department: dept.slug, sort: "featured", page: 1 }),
    getSettings(),
  ]);
  const empty = fresh.total === 0;
  const ask = whatsappUrl(settings.whatsappNumber, `Hi Sri's Threads, I'm looking for ${dept.label.toLowerCase()} wear. What do you have?`);

  return (
    <>
      <section className="dept-hero">
        <ParallaxBlock distance={60} className="dept-hero__bg">
          <SmartImg src={dept.image} alt="" w={1440} sizes="100vw" loading="eager" />
        </ParallaxBlock>
        <div className="dept-hero__shade" aria-hidden="true" />
        <Reveal className="dept-hero__text" y={30} blur>
          <p className="dept-hero__eyebrow">Sri&rsquo;s Threads</p>
          <h1>{dept.label}</h1>
          <p>{dept.blurb}</p>
          {!empty && <Link href={`/shop?department=${dept.slug}`} className="btn btn--soft">Shop all {dept.label}</Link>}
        </Reveal>
      </section>

      {collections.length > 0 && (
        <section className="section">
          <SectionTitle>Shop by Category</SectionTitle>
          <CollectionGrid cards={collections} hrefFor={(c) => `/shop?collection=${c.slug}`} variant="3" />
        </section>
      )}

      {empty ? (
        <section className="section coming">
          <Reveal y={24} className="coming__card">
            <h2>Our {dept.label} collection is arriving soon</h2>
            <p>We&rsquo;re adding new pieces right now. Message us on WhatsApp and we&rsquo;ll help you find what you need.</p>
            <a className="btn btn--whatsapp" href={ask} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
          </Reveal>
        </section>
      ) : (
        <>
          <section className="section">
            <SectionTitle>New Arrivals</SectionTitle>
            <TrendingCarousel products={fresh.items.slice(0, 12)} />
          </section>
          {popular.items.length > 0 && (
            <section className="section">
              <SectionTitle>Popular in {dept.label}</SectionTitle>
              <Stagger className="product-grid">
                {popular.items.slice(0, 8).map((p) => <StaggerItem key={p.id}><ProductCard p={p} /></StaggerItem>)}
              </Stagger>
              <Reveal className="center"><Link href={`/shop?department=${dept.slug}`} className="btn btn--primary">View all {fresh.total} products</Link></Reveal>
            </section>
          )}
        </>
      )}
    </>
  );
}
