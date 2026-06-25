import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decryptToken } from "./lib/session";

const AMIL_PAGES = [
  "/dashboard",
  "/muzakki",
  "/mustahik",
  "/transactions",
  "/distributions",
  "/zakat-types",
  "/reports",
  "/profile",
];

const MUZAKKI_PAGES = ["/muzakki-dashboard"];

// Menggunakan nama fungsi 'proxy' untuk Next.js 16 Proxy
export async function proxy(request: NextRequest) {
  // Bypass Server Actions to avoid proxy interference (e.g. redirecting POST requests)
  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // 1. Get session token from cookie
  const sessionToken = request.cookies.get("session_token")?.value;

  // 2. Decode/verify token
  let session = null;
  if (sessionToken) {
    session = await decryptToken(sessionToken);
  }

  // 3. Handle login path
  if (pathname === "/login") {
    if (session) {
      const redirectUrl = session.role === "amil"
        ? new URL("/dashboard", request.url)
        : new URL("/muzakki-dashboard", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. Handle Amil (Admin) routes
  const isAmilRoute = AMIL_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isAmilRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "amil") {
      return NextResponse.redirect(new URL("/muzakki-dashboard", request.url));
    }
  }

  // 5. Handle Muzakki routes
  const isMuzakkiRoute = MUZAKKI_PAGES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (isMuzakkiRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "amil" && session.role !== "muzakki") {
      // Fallback redirect
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role === "amil") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded proof files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
