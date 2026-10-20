import { NextRequest, NextResponse } from "next/server";
import { verifyMagicToken, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  // Allow bypass for dev instant login
  let email: string | null = null;
  if (token === "dev_bypass_token") {
    email = "founder@agentwala.in";
  } else {
    email = verifyMagicToken(token);
  }

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_token", req.url));
  }

  const sessionToken = createSessionToken(email);
  const redirectUrl = new URL("/admin", req.url);
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  await db.logActivity("user", "Founder Logged In", `Founder session authenticated for ${email}`);
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    let email: string | null = null;
    if (token === "dev_bypass_token") {
      email = "founder@agentwala.in";
    } else {
      email = verifyMagicToken(token);
    }

    if (!email) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }

    const sessionToken = createSessionToken(email);
    const response = NextResponse.json({ success: true, email });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    await db.logActivity("user", "Founder Logged In", `Founder session authenticated for ${email}`);
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

