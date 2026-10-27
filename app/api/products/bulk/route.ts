import { bulkUpdateProducts, listCollections, listDepartments, type BulkAction } from "@/lib/db";
import { fail, json, num, readJson, requireAdmin, str } from "@/lib/api";
import { isDepartment } from "@/lib/shared";

export const dynamic = "force-dynamic";

/** Admin: apply one change to many products. Body: { ids: string[], action: "activate" | "deactivate" | "delete" | "discount" | ... } */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<Record<string, unknown>>(req);
  const ids = Array.isArray(body?.ids) ? body!.ids.map((i) => str(i, 40)).filter(Boolean).slice(0, 500) : [];
  if (!ids.length) return fail("Select at least one product.");

  const a = body?.action;
  let op: BulkAction | null = null;
  if (a === "activate" || a === "deactivate" || a === "delete") op = { action: a };
  else if (a === "discount") {
    const percent = num(body?.percent, NaN);
    if (!(percent >= 0 && percent <= 90)) return fail("Discount must be between 0 and 90.");
    op = { action: "discount", percent };
  } else if (a === "department") {
    if (!isDepartment(body?.department, await listDepartments(true))) return fail("Unknown department.");
    op = { action: "department", department: body!.department as never };
  } else if (a === "collection" || a === "fabric" || a === "occasion") {
    const value = str(body?.value, 80);
    if (value && !(await listCollections(undefined, { includeInactive: true })).some((g) => g.kind === (a === "collection" ? "collection" : a) && g.slug === value))
      return fail("That group doesn't exist.");
    op = { action: a, value };
  } else if (a === "trending" || a === "isNew") op = { action: a, value: body?.value === true };
  else if (a === "stock") op = { action: "stock", value: num(body?.value) };
  if (!op) return fail("Unknown action.");

  return json({ affected: await bulkUpdateProducts(ids, op) });
}
