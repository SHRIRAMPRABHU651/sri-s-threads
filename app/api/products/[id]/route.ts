import { deleteProduct, getProduct, saveProduct } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import { parseProduct } from "@/lib/productInput";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  return p && p.active ? json(p) : fail("Product not found.", 404);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const existing = await getProduct(params.id);
  if (!existing) return fail("Product not found.", 404);
  const body = await readJson(req);
  if (!body) return fail("Invalid request body.");
  const parsed = parseProduct(body);
  if ("error" in parsed) return fail(parsed.error);
  return json(await saveProduct({ ...parsed, id: existing.id }));
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return (await deleteProduct(params.id)) ? json({ ok: true }) : fail("Product not found.", 404);
}
