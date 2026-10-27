"use client";

import { m } from "framer-motion";
import { DUR, EASE, VIEWPORT } from "./motion/config";

/** Ornamental section heading: the flourishes draw outward from the centre while the title pulls into focus. */
export default function SectionTitle({ children, as = "h2", eyebrow }: { children: React.ReactNode; as?: "h1" | "h2"; eyebrow?: string }) {
  const Tag = as === "h1" ? m.h1 : m.h2;
  const orn = (flip: boolean) => ({
    hidden: { opacity: 0, scaleX: 0.2 },
    visible: { opacity: 1, scaleX: 1, transition: { duration: DUR.slow, ease: EASE, delay: flip ? 0.12 : 0 } },
  });
  return (
    <m.div className="section-title" data-reveal="" initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      {eyebrow && <m.p className="section-title__eyebrow" variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}>{eyebrow}</m.p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <m.img src="/assets/icons/divider-top.svg" alt="" width={166} height={14} variants={orn(false)} />
      <Tag variants={{ hidden: { opacity: 0, y: 14, filter: "blur(8px)" }, visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: DUR.base, ease: EASE, delay: 0.1 } } }}>{children}</Tag>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <m.img src="/assets/icons/divider-bottom.svg" alt="" width={166} height={14} variants={orn(true)} />
    </m.div>
  );
}
