import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "agmeta_session";

/**
 * Get the HMAC signing secret.
 * In production, throws a clear error if AUTH_SECRET is missing.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET environment variable is missing in production.");
    }
    return "agmeta_dev_secret_key_884920492193";
  }
  return secret;
}

/**
 * Generate a stateless signed HMAC magic link token.
 * Contains base64url payload with email and 15-minute expiration timestamp.
 */
export function generateMagicToken(email: string): string {
  const secret = getAuthSecret();
  const payload = {
    email: email.trim().toLowerCase(),
    expires_at: Date.now() + 15 * 60 * 1000, // 15 mins
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(`mag:${b64}`).digest("hex");
  return `mag_${b64}.${sig}`;
}

/**
 * Verify a stateless signed HMAC magic link token.
 * Validates HMAC signature with constant-time equality and checks expiration.
 */
export function verifyMagicToken(token: string): string | null {
  if (!token || !token.startsWith("mag_") || !token.includes(".")) {
    return null;
  }
  const secret = getAuthSecret();
  const raw = token.slice(4); // remove "mag_"
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", secret).update(`mag:${b64}`).digest("hex");
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (!payload.email || !payload.expires_at) return null;
    if (Date.now() > payload.expires_at) return null;
    return payload.email;
  } catch {
    return null;
  }
}

/**
 * Generate a 30-day signed founder session token.
 */
export function createSessionToken(email: string): string {
  const secret = getAuthSecret();
  const payload = {
    email,
    created_at: Date.now(),
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

/**
 * Verify a session token with constant-time HMAC comparison.
 */
export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token || !token.includes(".")) return null;
  const secret = getAuthSecret();
  const [b64, sig] = token.split(".");
  if (!b64 || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (Date.now() > payload.expires_at) return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export function getSessionFromRequest(req: NextRequest): { email: string } | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
