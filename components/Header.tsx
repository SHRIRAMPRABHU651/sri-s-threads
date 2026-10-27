"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { DEPARTMENTS } from "@/lib/shared";
import type { Department } from "@/lib/types";
import { Wordmark } from "./Logo";
import { EASE } from "./motion/config";
import { useHideOnScroll } from "./motion/ScrollUI";
import { useStore } from "./Store";

type Group = { slug: string; name: string; department: string };

function DeptNav() {
  const path = usePathname();
  const sp = useSearchParams();
  const active = DEPARTMENTS.find((d) => path === `/${d.slug}` || sp.get("department") === d.slug)?.slug;
  return (
    <nav className="site-nav" aria-label="Departments">
      <ul>
        {DEPARTMENTS.map((d) => (
          <li key={d.slug}><Link href={`/${d.slug}`} className={active === d.slug ? "is-active" : ""} aria-current={active === d.slug ? "page" : undefined}>{d.label}</Link></li>
        ))}
        <li><Link href="/shop?new=1" className={path === "/shop" && sp.get("new") === "1" ? "is-active" : ""}>New Arrivals</Link></li>
        <li><Link href="/shop?discount=30&sort=discount" className="site-nav__sale">Sale</Link></li>
      </ul>
    </nav>
  );
}

export default function Header({ announcement, collections }: { announcement: string; collections: Group[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Department | null>(null);
  const { count, wishlist } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);
  const hidden = useHideOnScroll();
  const path = usePathname();

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  const [lead, ...rest] = announcement.split(". ");
  return (
    <>
      <div className="announce">
        {rest.length ? (<>{lead}. <Link href="/shop">{rest.join(". ")}</Link></>) : announcement}
      </div>
      <m.header className="site-header" animate={{ y: hidden && !open ? "-100%" : "0%" }} transition={{ duration: 0.35, ease: EASE }}>
        <div className="site-header__inner">
          <div className="site-header__group">
            <button className="icon-btn" type="button" aria-label="Open menu" aria-expanded={open} aria-controls="menu-drawer" onClick={() => setOpen(true)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/menu.svg" alt="" />
            </button>
            <Link className="icon-btn" href="/shop#search" aria-label="Search">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/search.svg" alt="" />
            </Link>
          </div>
          <Link className="site-header__logo" href="/" aria-label="Sri's Threads — home"><Wordmark height={46} /></Link>
          <div className="site-header__group site-header__group--end">
            <Link className="icon-btn" href="/wishlist" aria-label={`Wishlist (${wishlist.length})`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/heart.svg" alt="" />
              {wishlist.length > 0 && <span key={wishlist.length} className="badge-dot is-visible pop" aria-hidden="true">{wishlist.length}</span>}
            </Link>
            <Link className="icon-btn" href="/cart" aria-label={`Shopping bag (${count} items)`} data-bag-icon>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/bag.svg" alt="" />
              {count > 0 && <span key={count} className="badge-dot is-visible pop" aria-hidden="true">{count > 9 ? "9+" : count}</span>}
            </Link>
          </div>
        </div>
        <Suspense fallback={<nav className="site-nav" aria-hidden="true" />}><DeptNav /></Suspense>
      </m.header>

      <AnimatePresence>
        {open && (
          <>
            <m.div key="bd" className="drawer-backdrop is-open" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
            <m.nav key="dr" id="menu-drawer" className="drawer is-open" aria-label="Main menu" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.4, ease: EASE }}>
              <div className="drawer__head">
                <Wordmark height={34} />
                <button ref={closeRef} className="drawer__close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>&times;</button>
              </div>
              <m.div className="drawer__nav" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } } }}>
                {[{ href: "/", label: "Home" }, { href: "/shop", label: "All Products" }, { href: "/shop?new=1", label: "New Arrivals" }, { href: "/shop?discount=30&sort=discount", label: "Sale" }].map((n) => (
                  <m.div key={n.href} variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } }}>
                    <Link href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
                  </m.div>
                ))}
                <p className="drawer__label">Departments</p>
                {DEPARTMENTS.map((d) => {
                  const subs = collections.filter((c) => c.department === d.slug);
                  const isOpen = expanded === d.slug;
                  return (
                    <m.div key={d.slug} variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } }}>
                      <div className="drawer__dept">
                        <Link href={`/${d.slug}`} onClick={() => setOpen(false)}>{d.label}</Link>
                        {subs.length > 0 && (
                          <button type="button" className={`drawer__toggle${isOpen ? " is-open" : ""}`} aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} ${d.label} collections`} onClick={() => setExpanded(isOpen ? null : d.slug)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <m.div className="drawer__subs" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                            {subs.map((c) => (
                              <Link key={c.slug} href={`/shop?collection=${c.slug}`} className="drawer__sub" onClick={() => setOpen(false)}>{c.name}</Link>
                            ))}
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.div>
                  );
                })}
                <p className="drawer__label">Shop by</p>
                {[{ href: "/collections/fabric", label: "Fabric" }, { href: "/collections/occasion", label: "Occasion" }].map((n) => (
                  <m.div key={n.href} variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } }}>
                    <Link href={n.href} className="drawer__sub" onClick={() => setOpen(false)}>{n.label}</Link>
                  </m.div>
                ))}
                <p className="drawer__label">My account</p>
                {[{ href: "/wishlist", label: "Wishlist" }, { href: "/cart", label: "My Bag" }].map((n) => (
                  <m.div key={n.href} variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE } } }}>
                    <Link href={n.href} className="drawer__sub" onClick={() => setOpen(false)}>{n.label}</Link>
                  </m.div>
                ))}
              </m.div>
            </m.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
