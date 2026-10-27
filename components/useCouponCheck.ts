"use client";

import { useEffect, useState } from "react";
import type { CartLine } from "@/lib/types";

type State = { discount: number; error: string; ok: boolean; checking: boolean };

/** Validates the applied coupon against the server whenever the bag or code changes. */
export function useCouponCheck(code: string, lines: CartLine[]): State {
  const [state, setState] = useState<State>({ discount: 0, error: "", ok: false, checking: false });
  const key = JSON.stringify(lines.map((l) => [l.productId, l.qty]));
  useEffect(() => {
    if (!code || lines.length === 0) {
      setState({ discount: 0, error: "", ok: false, checking: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, checking: true }));
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, lines }),
    })
      .then(async (r) => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (cancelled) return;
        setState(ok ? { discount: body.discount, error: "", ok: true, checking: false } : { discount: 0, error: body.error || "Invalid coupon.", ok: false, checking: false });
      })
      .catch(() => !cancelled && setState({ discount: 0, error: "Couldn't check the coupon. Try again.", ok: false, checking: false }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, key]);
  return state;
}
