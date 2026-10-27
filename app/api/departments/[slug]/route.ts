import { deleteDepartment, listDepartments, saveDepartment } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { parseDepartment } from "@/lib/departmentInput";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const existing = (await listDepartments(true)).find((d) => d.slug === params.slug);
  if (!existing) return fail("Department not found.", 404);
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  // the slug (URL) is fixed after creation; everything else can change
  const parsed = parseDepartment({ ...body, slug: existing.slug });
  if ("error" in parsed) return fail(parsed.error);
  // keep at least one department switched on so the store is never empty
  if (!parsed.active && existing.active && (await listDepartments()).filter((d) => d.slug !== existing.slug).length === 0)
    return fail("At least one department must stay on.");
  const saved = await saveDepartment({ ...parsed, slug: existing.slug }, false);
  return "error" in saved ? fail(saved.error, 404) : json(saved);
}

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const r = await deleteDepartment(params.slug);
  return r.ok ? json({ ok: true }) : fail(r.error, r.error.includes("not found") ? 404 : 409);
}
