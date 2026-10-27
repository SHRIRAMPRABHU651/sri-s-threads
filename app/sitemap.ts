import type { MetadataRoute } from "next";
import { listDepartments, listProducts } from "@/lib/db";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticPages = ["", "/shop", "/collections", "/collections/fabric", "/collections/occasion"].map((p) => ({ url: `${base}${p}` }));
  try {
    const [products, depts] = await Promise.all([listProducts(), listDepartments()]);
    return [...staticPages, ...depts.map((d) => ({ url: `${base}/${d.slug}` })), ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.createdAt }))];
  } catch {
    return staticPages; // never fail the sitemap if the database is briefly unreachable
  }
}
