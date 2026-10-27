"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartLine, Product } from "@/lib/types";
import { salePrice } from "@/lib/shared";

type Ctx = {
  ready: boolean;
  catalog: Product[];
  lines: CartLine[];
  count: number;
  wishlist: string[];
  couponCode: string;
  add: (productId: string, opts?: { color?: string; qty?: number }) => void;
  setQty: (productId: string, color: string | undefined, qty: number) => void;
  remove: (productId: string, color: string | undefined) => void;
  clear: () => void;
  setCoupon: (code: string) => void;
  toggleWish: (productId: string) => void;
  toast: (msg: string) => void;
  product: (id: string) => Product | undefined;
  subtotal: number;
};

const StoreContext = createContext<Ctx | null>(null);
export const useStore = () => {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore must be used inside <StoreProvider>");
  return c;
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state still works for this session */
  }
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLines(read<CartLine[]>("st-cart", []));
    setWishlist(read<string[]>("st-wish", []));
    setCouponCode(read<string>("st-coupon", ""));
    setReady(true);
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Product[]) => {
        setCatalog(list);
        // drop cart lines for products that no longer exist
        setLines((ls) => ls.filter((l) => list.some((p) => p.id === l.productId)));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => { if (ready) write("st-cart", lines); }, [lines, ready]);
  useEffect(() => { if (ready) write("st-wish", wishlist); }, [wishlist, ready]);
  useEffect(() => { if (ready) write("st-coupon", couponCode); }, [couponCode, ready]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 2000);
  }, []);

  const add: Ctx["add"] = useCallback((productId, opts) => {
    const qty = opts?.qty ?? 1;
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === productId && l.color === opts?.color);
      if (i >= 0) return ls.map((l, n) => (n === i ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...ls, { productId, color: opts?.color, qty }];
    });
  }, []);

  const setQty: Ctx["setQty"] = useCallback((productId, color, qty) => {
    setLines((ls) =>
      ls.map((l) => (l.productId === productId && l.color === color ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)),
    );
  }, []);

  const remove: Ctx["remove"] = useCallback((productId, color) => {
    setLines((ls) => ls.filter((l) => !(l.productId === productId && l.color === color)));
  }, []);

  const toggleWish = useCallback(
    (id: string) =>
      setWishlist((w) => {
        const on = !w.includes(id);
        toast(on ? "Added to wishlist" : "Removed from wishlist");
        return on ? [...w, id] : w.filter((x) => x !== id);
      }),
    [toast],
  );

  const value = useMemo<Ctx>(() => {
    const product = (id: string) => catalog.find((p) => p.id === id);
    return {
      ready,
      catalog,
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      wishlist,
      couponCode,
      add,
      setQty,
      remove,
      clear: () => setLines([]),
      setCoupon: setCouponCode,
      toggleWish,
      toast,
      product,
      subtotal: lines.reduce((s, l) => {
        const p = product(l.productId);
        return s + (p ? salePrice(p) * l.qty : 0);
      }, 0),
    };
  }, [ready, catalog, lines, wishlist, couponCode, add, setQty, remove, toggleWish, toast]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className={`toast${toastOn ? " is-visible" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
    </StoreContext.Provider>
  );
}
