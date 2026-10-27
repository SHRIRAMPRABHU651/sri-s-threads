import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductView, { type Crumb } from "@/components/ProductView";
import SectionTitle from "@/components/SectionTitle";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { queryProducts } from "@/lib/catalog";
import { getProduct, getSettings, listCollections, listCoupons, listDepartments } from "@/lib/db";
import { departmentLabel } from "@/lib/shared";
import { whatsappUrl } from "@/lib/whatsapp";
import { optimizeImage } from "@/lib/imageUrl";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  if (!p || !p.active || !(await listDepartments()).some((d) => d.slug === p.department)) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.description?.slice(0, 160),
    openGraph: { title: p.name, description: p.description?.slice(0, 160), images: [{ url: optimizeImage(p.images[0], 1200) }] },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  const depts = await listDepartments();
  if (!product || !product.active || !depts.some((d) => d.slug === product.department)) notFound();
  const now = Date.now();
  const [couponsAll, groups, settings, related] = await Promise.all([
    listCoupons(),
    listCollections(undefined, { includeInactive: true }),
    getSettings(),
    queryProducts({ department: product.department, collections: product.collection ? [product.collection] : undefined, sort: "featured", page: 1 }),
  ]);
  const coupons = couponsAll
    .filter((c) => c.active && (!c.expiresAt || new Date(c.expiresAt).getTime() > now) && (c.usageLimit === 0 || c.used < c.usageLimit))
    .map(({ code, description, type, value, minOrder, maxDiscount }) => ({ code, description, type, value, minOrder, maxDiscount }))
    .slice(0, 6);

  const col = groups.find((g) => g.kind === "collection" && g.slug === product.collection);
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: departmentLabel(product.department, depts), href: `/${product.department}` },
    ...(col ? [{ label: col.name, href: `/shop?collection=${col.slug}` }] : []),
    { label: product.name },
  ];
  const more = related.items.filter((p) => p.id !== product.id).slice(0, 8);
  const ask = whatsappUrl(settings.whatsappNumber, `Hi Sri's Threads, I'm interested in "${product.name}". Is it available?`);

  return (
    <>
      <ProductView product={product} coupons={coupons} crumbs={crumbs} whatsappUrl={ask} />
      {more.length > 0 && (
        <section className="section related">
          <SectionTitle>You may also like</SectionTitle>
          <Stagger className="product-grid">
            {more.map((p) => <StaggerItem key={p.id}><ProductCard p={p} /></StaggerItem>)}
          </Stagger>
          <Reveal className="center"><Link href={`/shop?department=${product.department}`} className="btn btn--outline">View all {departmentLabel(product.department, depts)}</Link></Reveal>
        </section>
      )}
    </>
  );
}
