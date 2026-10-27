"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Logo";
import { useStore } from "./Store";

type Group = { slug: string; name: string };

export default function Header({ announcement, collections }: { announcement: string; collections: Group[] }) {
  const [open, setOpen] = useState(false);
  const { count, wishlist } = useStore();
  const closeRef = useRef<HTMLButtonElement>(null);

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
      <header className="site-header">
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
          <Link className="site-header__logo" href="/" aria-label="Sri's Threads — home"><Wordmark height={36} /></Link>
          <div className="site-header__group site-header__group--end">
            <Link className="icon-btn" href="/wishlist" aria-label={`Wishlist (${wishlist.length})`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/heart.svg" alt="" />
              <span className={`badge-dot${wishlist.length ? " is-visible" : ""}`} aria-hidden="true">{wishlist.length}</span>
            </Link>
            <Link className="icon-btn" href="/cart" aria-label={`Shopping bag (${count} items)`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/bag.svg" alt="" />
              <span className={`badge-dot${count ? " is-visible" : ""}`} aria-hidden="true">{count > 9 ? "9+" : count}</span>
            </Link>
          </div>
        </div>
      </header>
      <nav id="menu-drawer" className={`drawer${open ? " is-open" : ""}`} aria-label="Main menu" aria-hidden={!open}>
        <div className="drawer__head">
          <Wordmark height={34} />
          <button ref={closeRef} className="drawer__close" type="button" aria-label="Close menu" onClick={() => setOpen(false)}>&times;</button>
        </div>
        <div className="drawer__nav">
          {[
            { href: "/", label: "Home" },
            { href: "/shop", label: "All Products" },
          ].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>{n.label}</Link>
          ))}
          {collections.length > 0 && <p className="drawer__label">Collections</p>}
          {collections.map((c) => (
            <Link key={c.slug} href={`/shop?collection=${c.slug}`} className="drawer__sub" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>{c.name}</Link>
          ))}
          <p className="drawer__label">Shop by</p>
          {[
            { href: "/collections/fabric", label: "Fabric" },
            { href: "/collections/occasion", label: "Occasion" },
          ].map((n) => (
            <Link key={n.href} href={n.href} className="drawer__sub" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>{n.label}</Link>
          ))}
          <p className="drawer__label">My account</p>
          {[
            { href: "/wishlist", label: "Wishlist" },
            { href: "/cart", label: "My Bag" },
          ].map((n) => (
            <Link key={n.href} href={n.href} className="drawer__sub" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>{n.label}</Link>
          ))}
        </div>
      </nav>
      <div className={`drawer-backdrop${open ? " is-open" : ""}`} onClick={() => setOpen(false)} />
    </>
  );
}
