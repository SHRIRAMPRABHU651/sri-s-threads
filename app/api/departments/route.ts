import { cookies } from "next/headers";
import { listDepartments, saveDepartment } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { COOKIE, verifySession } from "@/lib/auth";
import { parseDepartment } from "@/lib/departmentInput";

export const dynamic = "force-dynamic";

/** Public: departments that are switched on. Admin (`?all=1`): every department, including switched-off ones. */
export async function GET(req: Request) {
  const all = new URL(req.url).searchParams.get("all") === "1";
  const isAdmin = all && !!(await verifySession(cookies().get(COOKIE)?.value));
  return json(await listDepartments(isAdmin));
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseDepartment(body);
  if ("error" in parsed) return fail(parsed.error);
  const saved = await saveDepartment(parsed, true);
  return "error" in saved ? fail(saved.error, 409) : json(saved, 201);
}
