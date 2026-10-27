"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { useDepartments } from "./Departments";
import type { Collection, Department } from "@/lib/types";
import { EASE } from "./motion/config";
import SmartImg from "./SmartImg";

/** Home: featured collections with a department switcher. The grid cross-fades when you change tabs. */
export default function FeaturedTabs({ collections }: { collections: Collection[] }) {
  const DEPARTMENTS = useDepartments();
  const tabs = DEPARTMENTS.filter((d) => collections.some((c) => c.department === d.slug));
  const [dept, setDept] = useState<Department>(tabs[0]?.slug ?? "women");
  if (!tabs.length) return null;
  const items = collections.filter((c) => c.department === dept).slice(0, 8);
  return (
    <div>
      <div className="seg" role="tablist" aria-label="Departments">
        {tabs.map((t) => (
          <button key={t.slug} role="tab" type="button" aria-selected={dept === t.slug} className="seg__btn" onClick={() => setDept(t.slug)}>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={dept}
          className="collection-grid"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
        >
          {items.map((c, i) => (
            <m.div key={c.slug} initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE, delay: i * 0.06 } }}>
              <Link href={`/shop?collection=${c.slug}`} className="collection-card">
                <div className="collection-card__arch"><SmartImg src={c.image} alt="" w={600} sizes="(max-width: 640px) 45vw, 260px" /></div>
                <span className="collection-card__label">{c.name}</span>
              </Link>
            </m.div>
          ))}
        </m.div>
      </AnimatePresence>
      <div className="center"><Link href={`/${dept}`} className="btn btn--outline">View all {DEPARTMENTS.find((d) => d.slug === dept)?.label}</Link></div>
    </div>
  );
}
