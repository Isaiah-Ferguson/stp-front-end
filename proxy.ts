import { NextResponse, type NextRequest } from "next/server";

// Server-side route protection (#16) + role gating (#38). Because auth lives in
// first-party httpOnly cookies (see next.config.ts), this runs before any admin page
// HTML/JS is served — unauthenticated visitors are redirected at the edge instead of
// after client hydration. This is a UX gate; the backend independently enforces
// authentication and roles on every API call.

const ACCESS_COOKIE = "ss_access";
const REFRESH_COOKIE = "ss_refresh";

/**
 * Reads the role claim from the JWT payload WITHOUT verifying the signature — fine
 * here because this only decides which page shell to serve; the API verifies the
 * signature on every real request.
 */
function roleFromJwt(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return (JSON.parse(json) as { role?: string }).role ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

  if (!hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin-only pages: staff users get bounced to the dashboard.
  if (request.nextUrl.pathname.startsWith("/users")) {
    const token = request.cookies.get(ACCESS_COOKIE)?.value;
    if (!token || roleFromJwt(token) !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Every route in the (admin) group. Route groups don't appear in URLs, so list the
// segments explicitly — a new admin page must be added here to be protected.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/attendance/:path*",
    "/calendar/:path*",
    "/roster/:path*",
    "/tracker/:path*",
    "/planning/:path*",
    "/year-calendar/:path*",
    "/cohort-rollup/:path*",
    "/games/:path*",
    "/skills/:path*",
    "/staff/:path*",
    "/tasks/:path*",
    "/documents/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/account/:path*",
    "/programs/:path*",
  ],
};
