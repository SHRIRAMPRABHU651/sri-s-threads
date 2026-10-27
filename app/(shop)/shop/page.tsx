import type { Metadata } from "next";
import ShopView from "@/components/shop/ShopView";
import { queryProducts } from "@/lib/catalog";
import { parseCatalogQuery } from "@/lib/catalogQuery";
import { listCollections, listDepartments } from "@/lib/db";
import { departmentLabel } from "@/lib/shared";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const query = parseCatalogQuery(searchParams);
  const [result, groups, depts] = await Promise.all([queryProducts(query), listCollections(), listDepartments()]);
  // page title reflects what the shopper picked
  const only = (arr?: string[]) => (arr?.length === 1 ? arr[0] : undefined);
  const col = only(query.collections);
  const title =
    (col && groups.find((g) => g.kind === "collection" && g.slug === col)?.name) ||
    (query.q && `Results for “${query.q}”`) ||
    (query.isNew && "New Arrivals") ||
    (query.discountMin && "Sale") ||
    (query.department && departmentLabel(query.department, depts)) ||
    "All Products";
  return <ShopView result={result} query={query} groups={groups} title={title} />;
}
