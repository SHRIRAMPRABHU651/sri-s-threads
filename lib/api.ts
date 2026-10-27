import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, verifySession } from "./auth";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** Returns a 401 response if the caller isn't a logged-in admin, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await verifySession(cookies().get(COOKIE)?.value);
  return session ? null : fail("Unauthorized", 401);
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max = 5000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
};
export const bool = (v: unknown) => v === true || v === "true" || v === 1;
