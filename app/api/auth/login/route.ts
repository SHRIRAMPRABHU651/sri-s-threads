import { NextResponse } from "next/server";
import { COOKIE, SESSION_MAX_AGE, adminCredentials, createSession, safeEqual } from "@/lib/auth";
import { fail, readJson, str } from "@/lib/api";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (await isLoginBlocked(ip)) return fail("Too many attempts. Try again in a few minutes.", 429);

  const body = await readJson(req);
  const { username, password } = adminCredentials();
  const okUser = safeEqual(str(body?.username, 100), username);
  const okPass = safeEqual(str(body?.password, 200), password);
  if (!(okUser && okPass)) {
    await recordLoginFailure(ip);
    return fail("Incorrect username or password.", 401);
  }
  await clearLoginFailures(ip);
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
