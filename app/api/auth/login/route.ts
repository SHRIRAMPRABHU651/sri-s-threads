import { NextResponse } from "next/server";
import { COOKIE, SESSION_MAX_AGE, adminCredentials, createSession, safeEqual } from "@/lib/auth";
import { fail, readJson, str } from "@/lib/api";

export const dynamic = "force-dynamic";

// naive in-memory throttle: 6 failed attempts per IP per 15 minutes
const attempts = new Map<string, { n: number; reset: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rec = attempts.get(ip);
  if (rec && rec.reset > Date.now() && rec.n >= 6) return fail("Too many attempts. Try again in a few minutes.", 429);

  const body = await readJson(req);
  const { username, password } = adminCredentials();
  const okUser = safeEqual(str(body?.username, 100), username);
  const okPass = safeEqual(str(body?.password, 200), password);
  if (!(okUser && okPass)) {
    const next = rec && rec.reset > Date.now() ? { n: rec.n + 1, reset: rec.reset } : { n: 1, reset: Date.now() + 15 * 60_000 };
    attempts.set(ip, next);
    return fail("Incorrect username or password.", 401);
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSession(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
