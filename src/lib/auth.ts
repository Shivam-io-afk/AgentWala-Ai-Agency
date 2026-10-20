import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "./db";
import { getAppDate, getAppTimeISO } from "./clock";

const AUTH_SECRET = process.env.AUTH_SECRET || "agentwala_dev_secret_key_884920492193";
const COOKIE_NAME = "agentwala_session";

// In-memory or file-backed magic link tokens
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

export function generateMagicToken(email: string): string {
  const token = "mag_" + crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
  magicTokens.set(token, { email, expiresAt });
  return token;
}

export function verifyMagicToken(token: string): string | null {
  const item = magicTokens.get(token);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    magicTokens.delete(token);
    return null;
  }
  magicTokens.delete(token);
  return item.email;
}

export function createSessionToken(email: string): string {
  const payload = {
    email,
    created_at: Date.now(),
    expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(b64).digest("hex");
  return `${b64}.${sig}`;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token || !token.includes(".")) return null;
  const [b64, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(b64).digest("hex");
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    if (Date.now() > payload.expires_at) return null;
    return { email: payload.email };
  } catch (e) {
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

