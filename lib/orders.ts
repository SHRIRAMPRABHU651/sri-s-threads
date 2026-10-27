import "server-only";
import type { CartLine, Order } from "./types";
import { evaluateCoupon, salePrice } from "./shared";
import { getCouponByCode, getProductsByIds, insertOrder, releaseCoupon, releaseStock, reserveCoupon, reserveStock } from "./db";

export type OrderInput = {
  customer: Order["customer"];
  lines: CartLine[];
  couponCode?: string;
};

/**
 * Turns a cart into an order. Prices, discounts, coupon rules and stock are all decided here on the server;
 * stock and coupon usage are claimed atomically and rolled back if anything fails.
 */
export async function placeOrder(input: OrderInput): Promise<Order | { error: string }> {
  const ids = [...new Set(input.lines.map((l) => l.productId))];
  const products = await getProductsByIds(ids);

  const items: Order["items"] = [];
  for (const l of input.lines) {
    const p = products.find((x) => x.id === l.productId);
    if (!p || !p.active) return { error: "One of the items in your bag is no longer available." };
    const color = l.color || undefined;
    if (color && p.colors.length && !p.colors.some((c) => c.name === color)) return { error: `${p.name} is no longer available in ${color}.` };
    // sizes: required when there is a choice, otherwise implied
    const size = p.sizes.length > 1 ? l.size : p.sizes[0];
    if (p.sizes.length > 1 && (!size || !p.sizes.includes(size))) return { error: `Please choose a size for ${p.name}.` };
    items.push({
      productId: p.id,
      name: p.name,
      image: p.colors.find((c) => c.name === color)?.image || p.images[0],
      color,
      size,
      qty: l.qty,
      price: salePrice(p),
      mrp: p.mrp,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);

  let discount = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const check = evaluateCoupon(await getCouponByCode(input.couponCode), subtotal);
    if (!check.ok) return { error: check.error };
    if (!(await reserveCoupon(check.coupon.code))) return { error: "This coupon has reached its usage limit." };
    discount = check.discount;
    couponCode = check.coupon.code;
  }

  const stockLines = items.map((i) => ({ productId: i.productId, qty: i.qty }));
  const stock = await reserveStock(stockLines);
  if (!stock.ok) {
    if (couponCode) await releaseCoupon(couponCode);
    const short = products.find((p) => p.id === stock.productId);
    return { error: `Sorry, ${short?.name ?? "an item"} doesn't have enough stock for the quantity you chose.` };
  }

  try {
    return await insertOrder({ customer: input.customer, items, subtotal, discount, couponCode, total: subtotal - discount });
  } catch (e) {
    await releaseStock(stockLines);
    if (couponCode) await releaseCoupon(couponCode);
    throw e;
  }
}
