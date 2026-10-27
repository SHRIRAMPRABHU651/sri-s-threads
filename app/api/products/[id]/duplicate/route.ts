import { duplicateProduct } from "@/lib/db";
import { fail, json, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Admin: copy a product (created hidden so it can be edited before going live). */
export async function POST(_: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const copy = await duplicateProduct(params.id);
  return copy ? json(copy, 201) : fail("Product not found.", 404);
}
