"use client";

import { AnimatePresence, m, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useState } from "react";
import { EASE } from "./config";

/** Slim brand-gold reading-progress bar fixed to the top edge. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return <m.div aria-hidden="true" className="scroll-progress" style={{ scaleX }} />;
}

/** Floating "back to top" button that appears after one screen of scrolling. */
export function BackToTop() {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > 900));
  return (
    <AnimatePresence>
      {show && (
        <m.button
          type="button"
          className="back-to-top"
          aria-label="Back to top"
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ duration: 0.3, ease: EASE }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </m.button>
      )}
    </AnimatePresence>
  );
}

/** true while the user is scrolling down past the header (→ hide it), false when scrolling up. */
export function useHideOnScroll(threshold = 140) {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    if (y < threshold) setHidden(false);
    else if (y > prev + 4) setHidden(true);
    else if (y < prev - 4) setHidden(false);
  });
  return hidden;
}
