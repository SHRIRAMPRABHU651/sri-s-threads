"use client";

import Link from "next/link";
import { inr, salePrice } from "@/lib/shared";
import { useStore } from "./Store";
import { useCouponCheck } from "./useCouponCheck";
import CouponBox from "./CouponBox";

export default function CartView() {
  const { ready, catalog, lines, product, setQty, remove, subtotal, couponCode } = useStore();
  const coupon = useCouponCheck(couponCode, lines);

  if (!ready || (lines.length > 0 && catalog.length === 0)) return <p className="empty">Loading your bag…</p>;
  if (lines.length === 0)
    return (
      <div className="empty">
        <p>Your bag is empty.</p>
        <Link href="/shop" className="btn btn--primary">Continue shopping</Link>
      </div>
    );

  const discount = coupon.ok ? coupon.discount : 0;
  return (
    <div className="cart-layout">
      <div className="cart-lines">
        {lines.map((l) => {
          const p = product(l.productId);
          if (!p) return null;
          const image = p.colors.find((c) => c.name === l.color)?.image || p.images[0];
          return (
            <div className="cart-line" key={`${l.productId}-${l.color ?? ""}`}>
              <Link href={`/product/${p.slug}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="cart-line__img" src={image} alt={p.name} /></Link>
              <div className="cart-line__body">
                <Link href={`/product/${p.slug}`} className="cart-line__name">{p.name}</Link>
                <p className="cart-line__meta">{l.color ? `Color: ${l.color} · ` : ""}{p.size}</p>
                <p className="price"><span className="price__now" style={{ fontSize: 15 }}>{inr(salePrice(p))}</span>{p.discountPercent > 0 && <s className="price__was">{inr(p.mrp)}</s>}</p>
                <div className="cart-line__row">
                  <div className="qty">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(l.productId, l.color, l.qty - 1)}>−</button>
                    <span aria-live="polite">{l.qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty(l.productId, l.color, l.qty + 1)}>+</button>
                  </div>
                  <button type="button" className="link-btn" onClick={() => remove(l.productId, l.color)}>Remove</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="summary" aria-label="Order summary">
        <h2>Order summary</h2>
        <CouponBox {...coupon} />
        <div className="summary__row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        {discount > 0 && <div className="summary__row summary__row--discount"><span>Coupon ({couponCode})</span><span>−{inr(discount)}</span></div>}
        <div className="summary__row summary__row--total"><span>Total</span><span>{inr(subtotal - discount)}</span></div>
        <p className="note">Delivery charges (if any) are confirmed with you on WhatsApp.</p>
        <Link href="/checkout" className="btn btn--primary btn--block" style={{ minHeight: 44 }}>Continue to order</Link>
        <Link href="/shop" className="btn btn--outline btn--block">Continue shopping</Link>
      </aside>
    </div>
  );
}
