import type { Order } from "./types";
import { BRAND, inr } from "./shared";

export function orderMessage(o: Pick<Order, "number" | "customer" | "items" | "subtotal" | "discount" | "couponCode" | "total">): string {
  const c = o.customer;
  const lines = [
    `*New Order — ${BRAND}* (#${o.number})`,
    "",
    "*Customer*",
    `Name: ${c.name}`,
    `Mobile: ${c.mobile}`,
    `Address: ${c.address}, ${c.city}, ${c.state} - ${c.pincode}`,
    ...(c.notes ? [`Notes: ${c.notes}`] : []),
    "",
    "*Items*",
    ...o.items.map(
      (it, i) => `${i + 1}. ${it.name}${[it.color, it.size && `Size ${it.size}`].filter(Boolean).length ? ` (${[it.color, it.size && `Size ${it.size}`].filter(Boolean).join(", ")})` : ""} × ${it.qty} — ${inr(it.price * it.qty)}`,
    ),
    "",
    `Subtotal: ${inr(o.subtotal)}`,
    ...(o.discount > 0 ? [`Coupon ${o.couponCode}: -${inr(o.discount)}`] : []),
    `*Total: ${inr(o.total)}*`,
    "",
    "Please confirm my order. Thank you!",
  ];
  return lines.join("\n");
}

export const whatsappUrl = (number: string, text: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
