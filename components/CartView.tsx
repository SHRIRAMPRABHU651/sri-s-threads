"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { inr, salePrice } from "@/lib/shared";
import { EASE } from "./motion/config";
import SmartImg from "./SmartImg";
import { useStore } from "./Store";
import { useCouponCheck } from "./useCouponCheck";
import CouponBox from "./CouponBox";

export default function CartView() {
  const { ready, loading, lines, product, setQty, remove, subtotal, couponCode } = useStore();
  const coupon = useCouponCheck(couponCode, lines);

  if (!ready || (lines.length > 0 && loading && lines.some((l) => !product(l.productId)))) {
    return (
      <div className="cart-layout" aria-busy="true" aria-label="Loading your bag">
        <div className="cart-lines">{[0, 1].map((i) => <div key={i} className="cart-line"><div className="skeleton" style={{ width: 84, height: 112 }} /><div className="skeleton" style={{ height: 70 }} /></div>)}</div>
        <div className="summary"><div className="skeleton" style={{ height: 180 }} /></div>
      </div>
    );
  }
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
        <AnimatePresence initial={false}>
          {lines.map((l) => {
            const p = product(l.productId);
            if (!p) return null;
            const image = p.colors.find((c) => c.name === l.color)?.image || p.images[0];
            const key = { productId: l.productId, color: l.color, size: l.size };
            return (
              <m.div
                className="cart-line"
                key={`${l.productId}|${l.color ?? ""}|${l.size ?? ""}`}
                layout={false}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } }}
                exit={{ opacity: 0, x: -40, height: 0, paddingBlock: 0, overflow: "hidden", transition: { duration: 0.35, ease: EASE } }}
              >
                <Link href={`/product/${p.slug}`}><SmartImg className="cart-line__img" src={image} alt={p.name} w={240} sizes="110px" /></Link>
                <div className="cart-line__body">
                  <Link href={`/product/${p.slug}`} className="cart-line__name">{p.name}</Link>
                  <p className="cart-line__meta">{[l.color && `Color: ${l.color}`, l.size && `Size: ${l.size}`].filter(Boolean).join(" · ")}</p>
                  <p className="price"><span className="price__now" style={{ fontSize: 15 }}>{inr(salePrice(p))}</span>{p.discountPercent > 0 && <s className="price__was">{inr(p.mrp)}</s>}</p>
                  <div className="cart-line__row">
                    <div className="qty">
                      <button type="button" aria-label="Decrease quantity" onClick={() => setQty(key, l.qty - 1)}>−</button>
                      <span aria-live="polite">{l.qty}</span>
                      <button type="button" aria-label="Increase quantity" onClick={() => setQty(key, l.qty + 1)}>+</button>
                    </div>
                    <button type="button" className="link-btn" onClick={() => remove(key)}>Remove</button>
                  </div>
                </div>
              </m.div>
            );
          })}
        </AnimatePresence>
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
