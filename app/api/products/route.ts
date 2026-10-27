import { listCollections, listProducts, saveProduct } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { parseProduct } from "@/lib/productInput";
import { cookies } from "next/headers";
import { COOKIE, verifySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const isAdmin = all && !!(await verifySession(cookies().get(COOKIE)?.value));
  return json(await listProducts({ includeInactive: isAdmin }));
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseProduct(body, await listCollections(undefined, { includeInactive: true }));
  if ("error" in parsed) return fail(parsed.error);
  return json(await saveProduct(parsed), 201);
}
