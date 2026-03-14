import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Note: Middleware runs on the edge, so it can't read Zustand's localStorage.
  // We'll use a cookie named 'ahia-session' for the actual redirection.
  const session = request.cookies.get("ahia-session");

  if (pathname.includes("/user/") && !session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*"],
};
