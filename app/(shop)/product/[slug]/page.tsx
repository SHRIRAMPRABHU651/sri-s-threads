import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/ProductView";
import { getProduct, listCoupons } from "@/lib/db";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  return { title: p?.name ?? "Product", description: p?.description?.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product || !product.active) notFound();
  const now = Date.now();
  const coupons = (await listCoupons())
    .filter((c) => c.active && (!c.expiresAt || new Date(c.expiresAt).getTime() > now) && (c.usageLimit === 0 || c.used < c.usageLimit))
    .map(({ code, description, type, value, minOrder, maxDiscount }) => ({ code, description, type, value, minOrder, maxDiscount }))
    .slice(0, 6);
  return <ProductView product={product} coupons={coupons} />;
}
