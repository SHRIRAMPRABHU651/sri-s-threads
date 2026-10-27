"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Scroll-snap carousel controller: prev/next with wrap, dots, optional autoplay. */
export function useCarousel(count: number, autoplayMs = 0) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [isStatic, setStatic] = useState(false);
  const paused = useRef(false);

  const step = () => {
    const t = track.current;
    if (!t || t.children.length < 2) return t?.clientWidth || 1;
    return (t.children[1] as HTMLElement).offsetLeft - (t.children[0] as HTMLElement).offsetLeft || 1;
  };
  const maxScroll = () => (track.current ? track.current.scrollWidth - track.current.clientWidth : 0);

  const update = useCallback(() => {
    const t = track.current;
    if (!t) return;
    setIndex(Math.min(Math.round(t.scrollLeft / step()), Math.max(count - 1, 0)));
    setStatic(maxScroll() <= 2);
  }, [count]);

  const goTo = useCallback((i: number) => {
    const t = track.current;
    if (!t) return;
    const target = Math.max(0, Math.min(i, count - 1)) * step();
    t.scrollTo({ left: Math.min(target, maxScroll()), behavior: "smooth" });
  }, [count]);

  const move = useCallback((dir: 1 | -1) => {
    const t = track.current;
    if (!t) return;
    const atEnd = t.scrollLeft >= maxScroll() - 2;
    const atStart = t.scrollLeft <= 2;
    if (dir > 0 && atEnd) return goTo(0);
    if (dir < 0 && atStart) return t.scrollTo({ left: maxScroll(), behavior: "smooth" });
    goTo(Math.round(t.scrollLeft / step()) + dir);
  }, [goTo]);

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    t.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
    const late = setTimeout(update, 600); // after images lay out
    return () => {
      t.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      clearTimeout(late);
      cancelAnimationFrame(raf);
    };
  }, [update]);

  useEffect(() => {
    if (!autoplayMs || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!paused.current && !document.hidden) move(1); }, autoplayMs);
    return () => clearInterval(id);
  }, [autoplayMs, move]);

  const hold = {
    onMouseEnter: () => { paused.current = true; },
    onMouseLeave: () => { paused.current = false; },
    onFocus: () => { paused.current = true; },
    onBlur: () => { paused.current = false; },
    onTouchStart: () => { paused.current = true; },
  };

  return { track, index, isStatic, goTo, prev: () => move(-1), next: () => move(1), hold };
}
