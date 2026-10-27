"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";

/**
 * App-wide motion setup.
 * - LazyMotion + domAnimation keeps the animation runtime small (~20 kB) and loads features after hydration.
 * - reducedMotion="user": visitors who ask their OS for less motion get no transform/layout animation.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
