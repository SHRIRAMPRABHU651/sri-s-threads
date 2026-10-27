"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Coupon, Product } from "@/lib/types";
import { couponHeadline, inr, salePrice } from "@/lib/shared";
import { flyToBag } from "@/lib/fly";
import { EASE } from "./motion/config";
import { useCarousel } from "./useCarousel";
import SmartImg from "./SmartImg";
import { useStore } from "./Store";

type PublicCoupon = Pick<Coupon, "code" | "description" | "type" | "value" | "minOrder" | "maxDiscount">;
export type Crumb = { label: string; href?: string };

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

/** Fullscreen image viewer: arrow keys / buttons to browse, Esc to close. */
function Lightbox({ images, start, alt, onClose }: { images: string[]; start: number; alt: string; onClose: () => void }) {
  const [i, setI] = useState(start);
  const go = useCallback((d: number) => setI((n) => (n + d + images.length) % images.length), [images.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [go, onClose]);
  return (
    <m.div className="lightbox" role="dialog" aria-modal="true" aria-label={`${alt} — image viewer`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose}>
      <button type="button" className="lightbox__close" aria-label="Close viewer" onClick={onClose}>×</button>
      {images.length > 1 && <button type="button" className="lightbox__nav lightbox__nav--prev" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>}
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={i} className="lightbox__stage" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.28, ease: EASE }} onClick={(e) => e.stopPropagation()}>
          <SmartImg src={images[i]} alt={`${alt} — image ${i + 1}`} w={1440} sizes="100vw" loading="eager" />
        </m.div>
      </AnimatePresence>
      {images.length > 1 && <button type="button" className="lightbox__nav lightbox__nav--next" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>}
      <p className="lightbox__count" aria-live="polite">{i + 1} / {images.length}</p>
    </m.div>
  );
}

export default function ProductView({ product: p, coupons, crumbs, whatsappUrl }: { product: Product; coupons: PublicCoupon[]; crumbs: Crumb[]; whatsappUrl: string }) {
  const router = useRouter();
  const { add, toast, couponCode, setCoupon } = useStore();
  const g = useCarousel(p.images.length);
  const [color, setColor] = useState(p.colors[0]?.name);
  const [size, setSize] = useState<string | undefined>(p.sizes.length === 1 ? p.sizes[0] : undefined);
  const [sizeError, setSizeError] = useState(false);
  const [open, setOpen] = useState<string[]>(["description"]);
  const [viewer, setViewer] = useState<number | null>(null);
  const [stickyOn, setStickyOn] = useState(false);
  const cta = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const now = salePrice(p);
  const soldOut = p.stock < 1;
  const lowStock = !soldOut && p.stock <= 5;

  // show the sticky buy bar once the real buttons scroll out of view
  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const pickColor = (name: string, image: string) => {
    setColor(name);
    const i = p.images.indexOf(image);
    if (i >= 0) g.goTo(i);
  };

  /** Returns true when a size is chosen (or not needed); otherwise nudges the shopper to pick one. */
  const ensureSize = () => {
    if (p.sizes.length <= 1 || size) return true;
    setSizeError(true);
    toast("Please select a size");
    document.getElementById("size-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  };

  const addToBag = () => {
    if (!ensureSize()) return;
    add(p.id, { color, size });
    flyToBag(mediaRef.current, p.colors.find((c) => c.name === color)?.image || p.images[0]);
    toast("Added to bag");
  };
  const buyNow = () => {
    if (!ensureSize()) return;
    add(p.id, { color, size });
    router.push("/checkout");
  };

  const zoom = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const sections = [
    ...SECTIONS.filter((s) => p[s.key].trim()).map((s) => ({ id: s.key, title: s.title, body: p[s.key] })),
    { id: "order", title: "How ordering works", body: "Add your items to the bag, enter your mobile number and delivery address, and send your order to us on WhatsApp. We confirm availability, delivery time and payment details with you personally on WhatsApp." },
  ];

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {crumbs.map((c, i) => (
            <li key={c.label + i}>{c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
          ))}
        </ol>
      </nav>
      <div className="product">
        <div className="product__gallery">
          <div ref={mediaRef} className={`gallery carousel${g.isStatic ? " is-static" : ""}`}>
            <div className="carousel__track" ref={g.track}>
              {p.images.map((src, i) => (
                <div className="carousel__slide zoomable" key={src + i} onMouseMove={zoom} onClick={() => setViewer(i)} role="button" tabIndex={0} aria-label={`Open image ${i + 1} full screen`} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setViewer(i)}>
                  <SmartImg src={src} alt={`${p.name} — image ${i + 1}`} w={1080} sizes="(max-width: 900px) 100vw, 50vw" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
                </div>
              ))}
            </div>
            <div className="carousel__arrows" data-arrow>
              <button type="button" className="arrow-btn" aria-label="Previous image" onClick={g.prev}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/slider-left.svg" alt="" style={{ filter: "invert(1)" }} /></button>
              <button type="button" className="arrow-btn" aria-label="Next image" onClick={g.next}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/slider-right.svg" alt="" style={{ filter: "invert(1)" }} /></button>
            </div>
            <div className="gallery__dots dots" data-arrow>
              {p.images.map((_, i) => <button key={i} type="button" aria-label={`Show image ${i + 1}`} aria-current={g.index === i} onClick={() => g.goTo(i)} />)}
            </div>
          </div>
          {p.images.length > 1 && (
            <div className="gallery__thumbs">
              {p.images.map((src, i) => (
                <button key={src + i} type="button" className="swatch" aria-pressed={g.index === i} aria-label={`Show image ${i + 1}`} onClick={() => g.goTo(i)}>
                  <SmartImg src={src} alt="" w={160} sizes="64px" />
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
              {lowStock && <span className="badge badge--warn">Only {p.stock} left</span>}
            </div>
            {p.sku && <p className="note">SKU: {p.sku}</p>}
          </div>

          {p.discountPercent > 0 && <Countdown endsAt={p.saleEndsAt} />}

          <div className="product__options">
            {p.colors.length > 0 && (
              <div>
                <div className="option-label"><span>Color :</span><span>{color}</span></div>
                <div className="swatches" role="group" aria-label="Colour">
                  {p.colors.map((c) => (
                    <button key={c.name} type="button" className="swatch" aria-pressed={color === c.name} aria-label={c.name} title={c.name} onClick={() => pickColor(c.name, c.image)}>
                      <SmartImg src={c.image} alt="" w={160} sizes="64px" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div id="size-group">
              <div className="option-label"><span>Size :</span>{p.sizes.length === 1 ? <span className="badge badge--success">{p.sizes[0]}</span> : <span>{size ?? "Select a size"}</span>}</div>
              {p.sizes.length > 1 && (
                <m.div
                  className={`sizes${sizeError && !size ? " sizes--error" : ""}`}
                  role="radiogroup"
                  aria-label="Size"
                  animate={sizeError && !size ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                  transition={{ duration: 0.45 }}
                  key={sizeError ? "err" : "ok"}
                >
                  {p.sizes.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={size === s} className="size-pill" onClick={() => { setSize(s); setSizeError(false); }}>{s}</button>
                  ))}
                </m.div>
              )}
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

          <div className="product__cta" ref={cta}>
            <button type="button" className="btn btn--soft btn--block" disabled={soldOut} onClick={addToBag}>Add to bag</button>
            <button type="button" className="btn btn--primary btn--block" disabled={soldOut} onClick={buyNow}>Buy now</button>
            <a className="btn btn--outline btn--block" href={whatsappUrl} target="_blank" rel="noopener noreferrer">Ask about this on WhatsApp</a>
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

      <AnimatePresence>
        {stickyOn && !soldOut && (
          <m.div className="sticky-buy" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.4, ease: EASE }}>
            <div className="sticky-buy__info">
              <span className="sticky-buy__name">{p.name}</span>
              <span className="price"><span className="price__now">{inr(now)}</span>{p.discountPercent > 0 && <s className="price__was">{inr(p.mrp)}</s>}</span>
            </div>
            <button type="button" className="btn btn--primary" onClick={addToBag}>Add to bag</button>
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{viewer !== null && <Lightbox images={p.images} start={viewer} alt={p.name} onClose={() => setViewer(null)} />}</AnimatePresence>
    </>
  );
}
