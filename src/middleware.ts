import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isAdminPage || isAdminApi) {
    const sessionCookie = request.cookies.get("agentwala_session")?.value;

    let isAuthenticated = false;
    if (sessionCookie && sessionCookie.includes(".")) {
      try {
        const [b64] = sessionCookie.split(".");
        // Decode base64url payload
        const jsonStr = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(jsonStr);
        if (payload.expires_at && payload.expires_at > Date.now()) {
          isAuthenticated = true;
        }
      } catch (e) {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: "Unauthorized. Please log in as founder at /login." },
          { status: 401 }
        );
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/dev", "/dev/:path*"],
};

