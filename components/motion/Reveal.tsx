"use client";

import { m, type HTMLMotionProps, type Variants } from "framer-motion";
import { DUR, EASE, STAGGER, VIEWPORT } from "./config";

type Tag = "div" | "section" | "li" | "p" | "h2" | "article" | "span";
const TAGS = { div: m.div, section: m.section, li: m.li, p: m.p, h2: m.h2, article: m.article, span: m.span } as const;

type RevealProps = Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate" | "whileInView"> & {
  as?: Tag;
  delay?: number;
  /** Start offset in px (negative = rises from above). */
  y?: number;
  x?: number;
  scale?: number;
  /** Soft focus-pull; use only on small elements (titles) — blur filters are costly on large areas. */
  blur?: boolean;
  duration?: number;
};

/** Fade + rise into view once, as the element enters the viewport. */
export function Reveal({ as = "div", delay = 0, y = 28, x = 0, scale = 1, blur = false, duration = DUR.base, children, ...rest }: RevealProps) {
  const Comp = TAGS[as] as typeof m.div;
  const variants: Variants = {
    hidden: { opacity: 0, y, x, scale, ...(blur ? { filter: "blur(8px)" } : {}) },
    visible: { opacity: 1, y: 0, x: 0, scale: 1, ...(blur ? { filter: "blur(0px)" } : {}), transition: { duration, delay, ease: EASE } },
  };
  return (
    <Comp data-reveal="" variants={variants} initial="hidden" whileInView="visible" viewport={VIEWPORT} {...rest}>
      {children}
    </Comp>
  );
}

/** Parent that staggers its <StaggerItem> children as a group enters the viewport. */
export function Stagger({ as = "div", gap = STAGGER, delay = 0, children, ...rest }: Omit<RevealProps, "y" | "x" | "scale" | "blur" | "duration"> & { gap?: number }) {
  const Comp = TAGS[as] as typeof m.div;
  const variants: Variants = { hidden: {}, visible: { transition: { staggerChildren: gap, delayChildren: delay } } };
  return (
    <Comp variants={variants} initial="hidden" whileInView="visible" viewport={VIEWPORT} {...rest}>
      {children}
    </Comp>
  );
}

export function StaggerItem({ as = "div", y = 26, scale = 0.98, duration = DUR.base, children, ...rest }: Omit<RevealProps, "delay" | "x" | "blur">) {
  const Comp = TAGS[as] as typeof m.div;
  const variants: Variants = {
    hidden: { opacity: 0, y, scale },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration, ease: EASE } },
  };
  return (
    <Comp data-reveal="" variants={variants} {...rest}>
      {children}
    </Comp>
  );
}
