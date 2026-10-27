"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Coupon, Product } from "@/lib/types";
import { couponHeadline, inr, salePrice } from "@/lib/shared";
import { useCarousel } from "./useCarousel";
import { useStore } from "./Store";

type PublicCoupon = Pick<Coupon, "code" | "description" | "type" | "value" | "minOrder" | "maxDiscount">;

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function Countdown({ endsAt }: { endsAt?: string }) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const target = endsAt && new Date(endsAt).getTime() > Date.now() ? new Date(endsAt).getTime() : endOfToday();
    const tick = () => setLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  const s = left ?? 0;
  const parts = [Math.min(99, Math.floor(s / 3600)), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <div className="countdown" role="timer" aria-label={left === null ? "Sale timer" : `Sale ends in ${parts[0]} hours ${parts[1]} minutes ${parts[2]} seconds`}>
      <div className="countdown__digits" aria-hidden="true">
        {parts.map((p, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <span className="countdown__sep">:</span>}
            <span className="countdown__pair">
              <span className="countdown__digit">{p[0]}</span>
              <span className="countdown__digit">{p[1]}</span>
            </span>
          </span>
        ))}
      </div>
      <div className="countdown__labels" aria-hidden="true"><span>Hours</span><span>Minutes</span><span>Seconds</span></div>
    </div>
  );
}

const SECTIONS: { key: "description" | "details" | "care"; title: string }[] = [
  { key: "description", title: "Description" },
  { key: "details", title: "Product details" },
  { key: "care", title: "Care & disclaimer" },
];

export default function ProductView({ product: p, coupons }: { product: Product; coupons: PublicCoupon[] }) {
  const router = useRouter();
  const { add, toast, couponCode, setCoupon } = useStore();
  const g = useCarousel(p.images.length);
  const [color, setColor] = useState(p.colors[0]?.name);
  const [open, setOpen] = useState<string[]>(["description"]);
  const now = salePrice(p);
  const soldOut = p.stock < 1;

  const pickColor = (name: string, image: string) => {
    setColor(name);
    const i = p.images.indexOf(image);
    if (i >= 0) g.goTo(i);
  };

  const addToBag = () => { add(p.id, { color }); toast("Added to bag"); };
  const buyNow = () => { add(p.id, { color }); router.push("/checkout"); };

  const sections = [
    ...SECTIONS.filter((s) => p[s.key].trim()).map((s) => ({ id: s.key, title: s.title, body: p[s.key] })),
    { id: "order", title: "How ordering works", body: "Add your items to the bag, enter your mobile number and delivery address, and send your order to us on WhatsApp. We confirm availability, delivery time and payment details with you personally on WhatsApp." },
  ];

  return (
    <div className="product">
      <div className="product__gallery">
        <div className={`gallery carousel${g.isStatic ? " is-static" : ""}`}>
          <div className="carousel__track" ref={g.track}>
            {p.images.map((src, i) => (
              <div className="carousel__slide" key={src + i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${p.name} — image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />
              </div>
            ))}
          </div>
          <div className="carousel__arrows" data-arrow>
            <button type="button" className="arrow-btn" aria-label="Previous image" onClick={g.prev}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/slider-left.svg" alt="" style={{ filter: "invert(1)" }} /></button>
            <button type="button" className="arrow-btn" aria-label="Next image" onClick={g.next}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/slider-right.svg" alt="" style={{ filter: "invert(1)" }} /></button>
          </div>
        </div>
        {p.images.length > 1 && (
          <div className="gallery__thumbs">
            {p.images.map((src, i) => (
              <button key={src + i} type="button" className="swatch" aria-pressed={g.index === i} aria-label={`Show image ${i + 1}`} onClick={() => g.goTo(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="product__info">
        <div className="product__head">
          <h1 className="product__title">{p.name}</h1>
          <div className="product__price">
            <span className="now">{inr(now)}</span>
            {p.discountPercent > 0 && <s className="was">{inr(p.mrp)}</s>}
            {p.discountPercent > 0 && <span className="badge badge--brand">{Math.round(p.discountPercent)}% OFF</span>}
            {soldOut && <span className="badge badge--danger">Sold out</span>}
          </div>
        </div>

        {p.discountPercent > 0 && <Countdown endsAt={p.saleEndsAt} />}

        <div className="product__options">
          {p.colors.length > 0 && (
            <div>
              <div className="option-label"><span>Color :</span><span>{color}</span></div>
              <div className="swatches" role="group" aria-label="Colour">
                {p.colors.map((c) => (
                  <button key={c.name} type="button" className="swatch" aria-pressed={color === c.name} aria-label={c.name} title={c.name} onClick={() => pickColor(c.name, c.image)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="size-row">
            <span className="option-label">Size :</span>
            <span className="badge badge--success">{p.size}</span>
          </div>
        </div>

        {coupons.length > 0 && (
          <div className="coupons" aria-label="Available coupons">
            {coupons.map((c) => {
              const applied = couponCode === c.code;
              return (
                <div className="coupon" key={c.code}>
                  <div className="coupon__offer">
                    <strong>{couponHeadline(c)}</strong>
                    <span>{c.description || (c.minOrder ? `*On orders above ₹${c.minOrder.toLocaleString("en-IN")}` : `Use code ${c.code}`)}</span>
                  </div>
                  <div className="coupon__actions">
                    <button type="button" className="btn btn--outline" onClick={() => toast(`Code ${c.code}${c.minOrder ? ` · min order ${inr(c.minOrder)}` : ""}${c.maxDiscount ? ` · up to ${inr(c.maxDiscount)} off` : ""}`)}>Details</button>
                    <button
                      type="button"
                      className={`btn btn--primary${applied ? " is-applied" : ""}`}
                      onClick={() => { setCoupon(applied ? "" : c.code); toast(applied ? "Coupon removed" : `${c.code} applied — see it in your bag`); }}
                    >
                      {applied ? "Applied" : "Apply coupon"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="product__cta">
          <button type="button" className="btn btn--soft btn--block" disabled={soldOut} onClick={addToBag}>Add to bag</button>
          <button type="button" className="btn btn--primary btn--block" disabled={soldOut} onClick={buyNow}>Buy now</button>
        </div>

        <div className="accordion">
          {sections.map((s) => {
            const isOpen = open.includes(s.id);
            return (
              <div key={s.id} className={`accordion__item${isOpen ? " is-open" : ""}`}>
                <button type="button" className="accordion__btn" aria-expanded={isOpen} aria-controls={`acc-${s.id}`} onClick={() => setOpen((o) => (o.includes(s.id) ? o.filter((x) => x !== s.id) : [...o, s.id]))}>
                  {s.title}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="icon-plus" src="/assets/icons/acc-plus.svg" alt="" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="icon-minus" src="/assets/icons/acc-minus.svg" alt="" />
                </button>
                <div className="accordion__panel" id={`acc-${s.id}`} role="region">
                  <div><p className="accordion__copy">{s.body}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
