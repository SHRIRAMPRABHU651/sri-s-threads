import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/auth";

/** Gate the admin UI. (Admin API routes also check the session themselves.) */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const session = await verifySession(req.cookies.get(COOKIE)?.value);
  if (session) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin/:path*"] };
