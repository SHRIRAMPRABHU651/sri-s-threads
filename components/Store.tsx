"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartLine, Product } from "@/lib/types";
import { salePrice } from "@/lib/shared";

type LineKey = { productId: string; color?: string; size?: string };

type Ctx = {
  ready: boolean;
  /** true while product details for the bag / wishlist are still loading */
  loading: boolean;
  lines: CartLine[];
  count: number;
  wishlist: string[];
  couponCode: string;
  add: (productId: string, opts?: { color?: string; size?: string; qty?: number }) => void;
  setQty: (key: LineKey, qty: number) => void;
  remove: (key: LineKey) => void;
  clear: () => void;
  setCoupon: (code: string) => void;
  toggleWish: (productId: string) => void;
  toast: (msg: string) => void;
  product: (id: string) => Product | undefined;
  /** products for the wishlist, in saved order */
  wishlistProducts: Product[];
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
const same = (l: CartLine, k: LineKey) => l.productId === k.productId && l.color === k.color && l.size === k.size;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [byId, setById] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const asked = useRef<Set<string>>(new Set());

  useEffect(() => {
    setLines(read<CartLine[]>("st-cart", []));
    setWishlist(read<string[]>("st-wish", []));
    setCouponCode(read<string>("st-coupon", ""));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) write("st-cart", lines); }, [lines, ready]);
  useEffect(() => { if (ready) write("st-wish", wishlist); }, [wishlist, ready]);
  useEffect(() => { if (ready) write("st-coupon", couponCode); }, [couponCode, ready]);

  // Load details only for products that are actually in the bag / wishlist (never the whole catalogue).
  const wanted = useMemo(() => [...new Set([...lines.map((l) => l.productId), ...wishlist])], [lines, wishlist]);
  useEffect(() => {
    if (!ready) return;
    const missing = wanted.filter((id) => !byId[id] && !asked.current.has(id));
    if (!missing.length) return;
    missing.forEach((id) => asked.current.add(id));
    setLoading(true);
    fetch(`/api/products?ids=${encodeURIComponent(missing.join(","))}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Product[]) => {
        setById((m) => ({ ...m, ...Object.fromEntries(list.map((p) => [p.id, p])) }));
        const found = new Set(list.map((p) => p.id));
        // products that no longer exist/are hidden disappear from the bag and wishlist
        setLines((ls) => ls.filter((l) => found.has(l.productId) || byId[l.productId] || !missing.includes(l.productId)));
        setWishlist((w) => w.filter((id) => found.has(id) || byId[id] || !missing.includes(id)));
      })
      .catch(() => missing.forEach((id) => asked.current.delete(id)))
      .finally(() => setLoading(false));
  }, [wanted, ready, byId]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 2000);
  }, []);

  const add: Ctx["add"] = useCallback((productId, opts) => {
    const qty = opts?.qty ?? 1;
    const key = { productId, color: opts?.color, size: opts?.size };
    setLines((ls) => {
      const i = ls.findIndex((l) => same(l, key));
      if (i >= 0) return ls.map((l, n) => (n === i ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...ls, { ...key, qty }];
    });
  }, []);

  const setQty: Ctx["setQty"] = useCallback((key, qty) => {
    setLines((ls) => ls.map((l) => (same(l, key) ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)));
  }, []);

  const remove: Ctx["remove"] = useCallback((key) => {
    setLines((ls) => ls.filter((l) => !same(l, key)));
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
    const product = (id: string) => byId[id];
    return {
      ready,
      loading,
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
      wishlistProducts: wishlist.map((id) => byId[id]).filter(Boolean),
      subtotal: lines.reduce((s, l) => {
        const p = product(l.productId);
        return s + (p ? salePrice(p) * l.qty : 0);
      }, 0),
    };
  }, [ready, loading, byId, lines, wishlist, couponCode, add, setQty, remove, toggleWish, toast]);

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className={`toast${toastOn ? " is-visible" : ""}`} role="status" aria-live="polite">{toastMsg}</div>
    </StoreContext.Provider>
  );
}
