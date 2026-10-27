"use client";

import { useCarousel } from "./useCarousel";

// Copy and avatars come from the Figma file (placeholder reviews — replace with real customer feedback).
const ITEMS = [
  { q: "I am genuinely impressed with the quality. Everything feels premium, and it delivered exactly what was promised. Will definitely recommend it to friends and family!", n: "Priya Singh", l: "29, Bengaluru", a: "avatar-1" },
  { q: "Delivery was quick and packaging was neat. The product works perfectly, though I’d love to see more color options next time. Overall, a great buy!", n: "John Matthews", l: "41, Mumbai", a: "avatar-2" },
  { q: "Initially I was unsure, but after using it for a week, I can confidently say this is worth every rupee. Performance is smooth and reliable. Totally satisfied!", n: "Sneha Raghavan", l: "34, Delhi", a: "avatar-3" },
  { q: "Customer support team was super helpful when I had a question. They guided me step by step and made the whole process stress-free. Rare to see such good service these days.", n: "Rahul Chauhan", l: "38, Pune", a: "avatar-4" },
  { q: "This has made my daily routine so much easier. It’s affordable, well-designed, and does exactly what it claims. I’m already planning to get another one as a gift.", n: "Meera Kaur", l: "45, Hyderabad", a: "avatar-5" },
];

export default function Testimonials() {
  const c = useCarousel(ITEMS.length, 7000);
  return (
    <div className="testimonials">
      <div className="carousel" {...c.hold}>
        <div className="carousel__track" ref={c.track}>
          {ITEMS.map((t) => (
            <figure className="carousel__slide testimonial" key={t.n} style={{ margin: 0 }}>
              <blockquote className="testimonial__quote" style={{ margin: 0 }}>“{t.q}”</blockquote>
              <figcaption className="testimonial__who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="testimonial__avatar" src={`/assets/img/${t.a}.webp`} alt="" loading="lazy" />
                <div>
                  <p className="testimonial__name">{t.n}</p>
                  <p className="testimonial__loc">{t.l}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="testimonials__nav">
        <button type="button" className="arrow-btn" aria-label="Previous review" onClick={c.prev}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/tst-left.svg" alt="" /></button>
        <div className="dots dots--dark">
          {ITEMS.map((t, i) => (
            <button key={t.n} type="button" aria-label={`Review ${i + 1}`} aria-current={c.index === i} onClick={() => c.goTo(i)} />
          ))}
        </div>
        <button type="button" className="arrow-btn" aria-label="Next review" onClick={c.next}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/tst-right.svg" alt="" /></button>
      </div>
    </div>
  );
}
