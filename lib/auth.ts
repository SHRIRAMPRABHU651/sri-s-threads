/**
 * Admin session: a signed, httpOnly cookie. Uses Web Crypto only, so the same code runs in
 * route handlers (Node) and in middleware (Edge).
 */
export const COOKIE = "st_admin";
const TTL_SECONDS = 60 * 60 * 12; // 12 hours

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set (16+ chars) in production.");
  }
  return "dev-only-secret-change-me";
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  arr.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey(usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

export async function createSession(username: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify({ u: username, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS })));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(["sign"]), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifySession(token: string | undefined | null): Promise<{ u: string } | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(["verify"]), fromB64url(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { u: string; exp: number };
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    return { u: data.u };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = TTL_SECONDS;

/** Constant-time string compare. */
export function safeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export function adminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin";
  let password = process.env.ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") throw new Error("ADMIN_PASSWORD must be set in production.");
    password = "admin123"; // development convenience only
  }
  return { username, password };
}
