import { deleteOrder, setOrderStatus } from "@/lib/db";
import { fail, json, readJson, requireAdmin } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "delivered", "cancelled"];

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await readJson<{ status?: OrderStatus }>(req);
  if (!body?.status || !STATUSES.includes(body.status)) return fail("Invalid status.");
  const o = await setOrderStatus(params.id, body.status);
  return o ? json(o) : fail("Order not found.", 404);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  return (await deleteOrder(params.id)) ? json({ ok: true }) : fail("Order not found.", 404);
}
