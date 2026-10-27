"use client";

import { m } from "framer-motion";
import { EASE } from "./motion/config";
import { ParallaxBlock } from "./motion/Parallax";
import { useCarousel } from "./useCarousel";

const SLIDES = ["hero-1", "hero-2", "hero-1", "hero-2", "hero-1"];

export default function HeroCarousel() {
  const c = useCarousel(SLIDES.length, 5500);
  return (
    <section className={`hero carousel${c.isStatic ? " is-static" : ""}`} aria-roledescription="carousel" aria-label="Featured" {...c.hold}>
      <ParallaxBlock distance={70} fade>
        <m.div className="hero__stage" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.3, ease: EASE }}>
          <div className="carousel__track" ref={c.track}>
            {SLIDES.map((s, i) => (
              <div className="carousel__slide" key={i} aria-label={`Slide ${i + 1} of ${SLIDES.length}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/assets/img/${s}.webp`} alt="Celebrate the elegance of tradition" loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} />
              </div>
            ))}
          </div>
        </m.div>
      </ParallaxBlock>
      <m.div className="hero__ui" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}>
        <div className="dots" data-arrow>
          {SLIDES.map((_, i) => (
            <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={c.index === i} onClick={() => c.goTo(i)} />
          ))}
        </div>
        <div className="hero__arrows" data-arrow>
          <button type="button" aria-label="Previous slide" onClick={c.prev}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/chev-left-white.svg" alt="" /></button>
          <button type="button" aria-label="Next slide" onClick={c.next}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/icons/chev-right-white.svg" alt="" /></button>
        </div>
      </m.div>
    </section>
  );
}
