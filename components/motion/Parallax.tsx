"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Image that drifts slower than the page while it crosses the viewport (depth without layout cost —
 * only `transform` is animated, so it stays on the GPU compositor).
 */
export function ParallaxImage({ src, alt = "", className, strength = 36, srcSet, sizes, loading = "lazy" }: {
  src: string; alt?: string; className?: string; strength?: number; srcSet?: string; sizes?: string; loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <m.img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading={loading} decoding="async" style={{ y, scale: 1.18, width: "100%", height: "100%", objectFit: "cover", willChange: "transform" }} />
    </div>
  );
}

/** Wraps any block so it moves at a fraction of scroll speed (e.g. the hero). */
export function ParallaxBlock({ children, className, distance = 90, fade = false }: { children: React.ReactNode; className?: string; distance?: number; fade?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, fade ? 0.35 : 1]);
  return (
    <div ref={ref} className={className}>
      <m.div style={{ y, opacity, willChange: "transform" }}>{children}</m.div>
    </div>
  );
}
