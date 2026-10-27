"use client";

import { m } from "framer-motion";
import { EASE } from "@/components/motion/config";

/** Re-mounts on every navigation → a soft fade/rise for each new page (enter-only, so it never delays the click). */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
      {children}
    </m.div>
  );
}
