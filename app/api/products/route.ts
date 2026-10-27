import { cookies } from "next/headers";
import { activeDepartmentSlugs, getProductsByIds, listCollections, listDepartments, listProducts, saveProduct } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { COOKIE, verifySession } from "@/lib/auth";
import { parseProduct } from "@/lib/productInput";

export const dynamic = "force-dynamic";

/**
 * Public:  GET /api/products?ids=a,b,c  → those (active) products (used by the bag and wishlist).
 * Admin:   GET /api/products?all=1      → every product including hidden ones.
 * (Shop browsing uses /api/shop — this endpoint never returns the whole public catalogue.)
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ids = (sp.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  if (ids.length) { const live = await activeDepartmentSlugs(); return json((await getProductsByIds(ids)).filter((p) => p.active && live.includes(p.department))); }
  if (sp.get("all") === "1" && (await verifySession(cookies().get(COOKIE)?.value))) return json(await listProducts({ includeInactive: true }));
  return json((await listProducts()).slice(0, 60)); // small, bounded default for simple integrations
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseProduct(body, await listCollections(undefined, { includeInactive: true }), await listDepartments(true));
  if ("error" in parsed) return fail(parsed.error);
  return json(await saveProduct(parsed), 201);
}
