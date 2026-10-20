import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyMagicToken, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { loadState, saveState } from "@/lib/storage";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function isFounderEmail(email: string): boolean {
  const normalized = email.toLowerCase().trim();
  const configured = (process.env.FOUNDER_EMAILS || process.env.FOUNDER_EMAIL || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured.includes(normalized);
  }
  return normalized === "founder@agentwala.in";
}

interface LoginAttemptsData {
  [ip: string]: { count: number; reset_at: number };
}

interface UsedTokensData {
  tokens: { [hash: string]: number };
}

function getTokenExpiry(token: string): number {
  try {
    const raw = token.startsWith("mag_") ? token.slice(4) : token;
    const [b64] = raw.split(".");
    const json = Buffer.from(b64, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    if (typeof payload.expires_at === "number") {
      return payload.expires_at;
    }
  } catch {
    // fallback
  }
  return Date.now() + 15 * 60 * 1000;
}

async function isTokenUsed(tokenHash: string): Promise<boolean> {
  const result = await loadState<UsedTokensData>("used_tokens");
  const tokens = result?.data?.tokens || {};
  const expiresAt = tokens[tokenHash];
  if (expiresAt && expiresAt > Date.now()) {
    return true;
  }
  return false;
}

async function markTokenUsed(tokenHash: string, expiresAt: number): Promise<void> {
  const result = await loadState<UsedTokensData>("used_tokens");
  const currentTokens = result?.data?.tokens || {};
  const tokens: { [hash: string]: number } = {};
  const now = Date.now();

  // Prune expired hashes on write to keep the object small
  for (const [h, exp] of Object.entries(currentTokens)) {
    if (exp > now) {
      tokens[h] = exp;
    }
  }

  tokens[tokenHash] = expiresAt;
  await saveState("used_tokens", { tokens }, result?.version);
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const result = await loadState<LoginAttemptsData>("login_attempts");
  const attempts: LoginAttemptsData = result?.data || {};
  const record = attempts[ip];
  const now = Date.now();

  if (record && now < record.reset_at) {
    if (record.count >= 5) {
      return true;
    }
  }
  return false;
}

async function recordFailedAttempt(ip: string): Promise<void> {
  const result = await loadState<LoginAttemptsData>("login_attempts");
  const attempts: LoginAttemptsData = { ...(result?.data || {}) };
  const now = Date.now();
  const record = attempts[ip];

  if (record && now < record.reset_at) {
    attempts[ip] = { count: record.count + 1, reset_at: record.reset_at };
  } else {
    attempts[ip] = { count: 1, reset_at: now + 15 * 60 * 1000 };
  }

  for (const [key, val] of Object.entries(attempts)) {
    if (now > val.reset_at) {
      delete attempts[key];
    }
  }

  await saveState("login_attempts", attempts, result?.version);
}

async function clearFailedAttempts(ip: string): Promise<void> {
  const result = await loadState<LoginAttemptsData>("login_attempts");
  if (!result?.data || !result.data[ip]) return;
  const attempts: LoginAttemptsData = { ...result.data };
  delete attempts[ip];
  await saveState("login_attempts", attempts, result.version);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", req.url));
  }

  // Allow bypass for dev instant login only in non-production
  let email: string | null = null;
  if (token === "dev_bypass_token" && process.env.NODE_ENV !== "production") {
    email = "founder@agentwala.in";
  } else {
    email = verifyMagicToken(token);
  }

  if (!email) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_token", req.url));
  }

  // Single-use enforcement for magic tokens (bypass only dev_bypass_token in development)
  if (token !== "dev_bypass_token") {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const isUsed = await isTokenUsed(tokenHash);
    if (isUsed) {
      return NextResponse.redirect(new URL("/login?error=used_token", req.url));
    }
    await markTokenUsed(tokenHash, getTokenExpiry(token));
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
    const body = await req.json();
    const { token, email, code } = body || {};

    // Branch 1: Login with Founder Login Code
    if (code !== undefined) {
      const ip = getClientIp(req);
      const isLimited = await checkRateLimit(ip);
      if (isLimited) {
        return NextResponse.json(
          { success: false, error: "Too many failed attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }

      const envCode = process.env.FOUNDER_LOGIN_CODE;
      const normalizedEmail = (email || "").trim().toLowerCase();

      const isValid = Boolean(
        envCode &&
        code &&
        safeCompare(code.trim(), envCode.trim()) &&
        isFounderEmail(normalizedEmail)
      );

      if (!isValid) {
        await recordFailedAttempt(ip);
        return NextResponse.json(
          { success: false, error: "Invalid email or login code." },
          { status: 401 }
        );
      }

      await clearFailedAttempts(ip);
      const sessionToken = createSessionToken(normalizedEmail);
      const response = NextResponse.json({
        success: true,
        email: normalizedEmail,
        redirect: "/admin",
      });

      response.cookies.set(COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });

      await db.logActivity(
        "user",
        "Founder Logged In",
        `Founder authenticated via login code for ${normalizedEmail}`
      );
      return response;
    }

    // Branch 2: Login with dev bypass or magic token
    let authEmail: string | null = null;
    if (token === "dev_bypass_token" && process.env.NODE_ENV !== "production") {
      authEmail = "founder@agentwala.in";
    } else if (token) {
      authEmail = verifyMagicToken(token);
    }

    if (!authEmail) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
    }

    // Single-use enforcement for magic tokens (bypass only dev_bypass_token in development)
    if (token !== "dev_bypass_token") {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const isUsed = await isTokenUsed(tokenHash);
      if (isUsed) {
        return NextResponse.json(
          { success: false, error: "This magic link has already been used. Please request a new one." },
          { status: 401 }
        );
      }
      await markTokenUsed(tokenHash, getTokenExpiry(token));
    }

    const sessionToken = createSessionToken(authEmail);
    const response = NextResponse.json({ success: true, email: authEmail, redirect: "/admin" });

    response.cookies.set(COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    await db.logActivity("user", "Founder Logged In", `Founder session authenticated for ${authEmail}`);
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

