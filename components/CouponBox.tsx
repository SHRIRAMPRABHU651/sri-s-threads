"use client";

import { useState } from "react";
import { useStore } from "./Store";

export default function CouponBox({ error, ok, checking }: { error: string; ok: boolean; checking: boolean }) {
  const { couponCode, setCoupon } = useStore();
  const [value, setValue] = useState("");
  return (
    <div>
      {couponCode ? (
        <p className={`msg ${ok ? "msg--ok" : error ? "msg--err" : ""}`}>
          {checking ? "Checking coupon…" : ok ? `Coupon ${couponCode} applied.` : error || `Coupon ${couponCode}`}{" "}
          <button type="button" className="link-btn" onClick={() => setCoupon("")}>Remove</button>
        </p>
      ) : (
        <form className="coupon-form" onSubmit={(e) => { e.preventDefault(); if (value.trim()) { setCoupon(value.trim().toUpperCase()); setValue(""); } }}>
          <label className="field">
            <span className="sr-only">Coupon code</span>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Coupon code" maxLength={30} />
          </label>
          <button className="btn btn--primary" type="submit">Apply</button>
        </form>
      )}
    </div>
  );
}
