import { json } from "@/lib/api";
import { queryProducts } from "@/lib/catalog";
import { parseCatalogQuery } from "@/lib/catalogQuery";

export const dynamic = "force-dynamic";

/** Public product search: filters + sort + pagination + facet counts. Same URL params as the /shop page. */
export async function GET(req: Request) {
  return json(await queryProducts(parseCatalogQuery(new URL(req.url).searchParams)));
}
