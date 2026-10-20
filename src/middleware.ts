import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify session cookie HMAC-SHA256 signature using Web Crypto (Edge & Serverless compatible)
 */
async function verifySessionCookie(
  sessionCookie: string | undefined,
  secret: string
): Promise<boolean> {
  if (!sessionCookie || !sessionCookie.includes(".")) {
    return false;
  }

  const [b64, sigHex] = sessionCookie.split(".");
  if (!b64 || !sigHex) {
    return false;
  }

  // 1. Verify expiration timestamp from base64url payload
  try {
    const jsonStr = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(jsonStr);
    if (!payload?.expires_at || payload.expires_at <= Date.now()) {
      return false;
    }
  } catch {
    return false;
  }

  // 2. Verify HMAC-SHA256 signature
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(b64));
    const expectedHex = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return constantTimeEqual(sigHex.toLowerCase(), expectedHex.toLowerCase());
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dev" || pathname.startsWith("/dev/")) {
    return new NextResponse(null, { status: 404, statusText: "Not Found" });
  }

  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isAdminPage || isAdminApi) {
    const authSecret = process.env.AUTH_SECRET;
    if (!authSecret && process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is missing in production.");
    }

    const secret = authSecret || "agentwala_dev_secret_key_884920492193";
    const sessionCookie = request.cookies.get("agentwala_session")?.value;
    const isAuthenticated = await verifySessionCookie(sessionCookie, secret);

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
