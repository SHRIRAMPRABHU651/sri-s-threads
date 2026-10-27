import { cookies } from "next/headers";
import { listCollections, saveCollection } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { COOKIE, verifySession } from "@/lib/auth";
import { parseCollection } from "@/lib/collectionInput";

export const dynamic = "force-dynamic";

/** Public: active groups only. Admin (`?all=1`): everything. */
export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const isAdmin = all && !!(await verifySession(cookies().get(COOKIE)?.value));
  return json(await listCollections(undefined, { includeInactive: isAdmin }));
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseCollection(body);
  if ("error" in parsed) return fail(parsed.error);
  const saved = await saveCollection(parsed);
  return "error" in saved ? fail(saved.error, 409) : json(saved, 201);
}
