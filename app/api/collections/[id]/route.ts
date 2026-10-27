import { deleteCollection, listDepartments, saveCollection } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { parseCollection } from "@/lib/collectionInput";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseCollection(body, await listDepartments(true));
  if ("error" in parsed) return fail(parsed.error);
  const saved = await saveCollection({ ...parsed, id: params.id });
  return "error" in saved ? fail(saved.error, saved.error.includes("not found") ? 404 : 409) : json(saved);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return (await deleteCollection(params.id)) ? json({ ok: true }) : fail("Collection not found.", 404);
}
