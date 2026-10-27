"use client";

import Link from "next/link";
import { useState } from "react";
import { inr, salePrice } from "@/lib/shared";
import { useStore } from "./Store";
import { useCouponCheck } from "./useCouponCheck";
import CouponBox from "./CouponBox";

type Done = { number: string; url: string; total: number };

export default function CheckoutView() {
  const { ready, loading, lines, product, subtotal, couponCode, setCoupon, clear } = useStore();
  const coupon = useCouponCheck(couponCode, lines);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);

  if (done)
    return (
      <div className="success">
        <div className="tick" aria-hidden="true">✓</div>
        <h1>Order #{done.number} received</h1>
        <p className="note" style={{ fontSize: 14, lineHeight: "22px" }}>
          Send your order to us on WhatsApp to finish. We’ll confirm availability, delivery and payment details with you there.
        </p>
        <a className="btn btn--whatsapp btn--block" href={done.url} target="_blank" rel="noopener noreferrer">Open WhatsApp to send order</a>
        <Link href="/" className="btn btn--outline btn--block">Back to home</Link>
      </div>
    );

  if (!ready || (lines.length > 0 && loading && lines.some((l) => !product(l.productId)))) return <p className="empty">Loading…</p>;
  if (lines.length === 0)
    return (
      <div className="empty">
        <p>Your bag is empty.</p>
        <Link href="/shop" className="btn btn--primary">Browse sarees</Link>
      </div>
    );

  const discount = coupon.ok ? coupon.discount : 0;
  const total = subtotal - discount;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: get("name"), mobile: get("mobile"), address: get("address"), city: get("city"), state: get("state"), pincode: get("pincode"), notes: get("notes") },
          lines,
          couponCode: coupon.ok ? couponCode : "",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || "Couldn't place your order. Please try again."); return; }
      clear();
      setCoupon("");
      setDone({ number: body.order.number, url: body.whatsappUrl, total: body.order.total });
      // Hand off to WhatsApp in a new tab so this confirmation stays here (button below is the fallback if popups are blocked).
      const w = window.open(body.whatsappUrl, "_blank");
      if (w) w.opener = null;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cart-layout">
      <form className="form-grid" onSubmit={submit} noValidate>
        <h2 style={{ font: "400 18px/24px var(--font-display)", color: "var(--brand-700)" }}>Delivery details</h2>
        <label>Full name<input name="name" autoComplete="name" required minLength={2} placeholder="Your name" /></label>
        <label>
          Mobile number
          <div className="phone"><span>+91</span><input name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={10} pattern="[6-9][0-9]{9}" placeholder="10-digit mobile number" /></div>
        </label>
        <label>Address<textarea name="address" autoComplete="street-address" required placeholder="House no., street, area, landmark" /></label>
        <div className="two">
          <label>City<input name="city" autoComplete="address-level2" required /></label>
          <label>State<input name="state" autoComplete="address-level1" required /></label>
        </div>
        <label>Pincode<input name="pincode" inputMode="numeric" autoComplete="postal-code" required maxLength={6} pattern="[0-9]{6}" placeholder="6-digit pincode" /></label>
        <label>Notes for us (optional)<input name="notes" maxLength={300} placeholder="Colour preference, delivery time…" /></label>
        {error && <p className="msg msg--err" role="alert">{error}</p>}
        <button className="btn btn--whatsapp btn--block" type="submit" disabled={busy}>
          {busy ? "Placing order…" : "Place order on WhatsApp"}
        </button>
        <p className="note">No online payment. Your order opens in WhatsApp so we can confirm everything with you.</p>
      </form>

      <aside className="summary" aria-label="Order summary">
        <h2>Your order</h2>
        {lines.map((l) => {
          const p = product(l.productId);
          if (!p) return null;
          return (
            <div className="summary__row" key={`${l.productId}-${l.color ?? ""}-${l.size ?? ""}`}>
              <span>{p.name}{[l.color, l.size].filter(Boolean).length ? ` (${[l.color, l.size && `Size ${l.size}`].filter(Boolean).join(", ")})` : ""} × {l.qty}</span>
              <span>{inr(salePrice(p) * l.qty)}</span>
            </div>
          );
        })}
        <CouponBox {...coupon} />
        <div className="summary__row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
        {discount > 0 && <div className="summary__row summary__row--discount"><span>Coupon ({couponCode})</span><span>−{inr(discount)}</span></div>}
        <div className="summary__row summary__row--total"><span>Total</span><span>{inr(total)}</span></div>
        <Link href="/cart" className="btn btn--outline btn--block">Edit bag</Link>
      </aside>
    </div>
  );
}
