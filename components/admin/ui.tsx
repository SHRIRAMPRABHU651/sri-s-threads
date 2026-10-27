"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Number that counts up to its value when it first appears / changes. */
export function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString("en-IN"), duration = 0.9 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const c = animate(prev.current, value, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setShown });
    prev.current = value;
    return () => c.stop();
  }, [value, duration]);
  return <>{format(shown)}</>;
}

/** Download rows as a CSV file (Excel-friendly: UTF-8 with BOM). */
export function downloadCsv(filename: string, rows: (string | number | boolean | undefined | null)[][]) {
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
