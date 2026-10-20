"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RobotIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("founder@agentwala.in");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err === "used_token") {
        setError("This magic link has already been used. Please request a new one.");
      } else if (err === "invalid_or_expired_token") {
        setError("Invalid or expired magic link. Please request a new one.");
      } else if (err === "missing_token") {
        setError("Missing authentication token. Please request a new login link.");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    // If founder login code is entered, submit directly to /api/auth/verify
    if (code.trim()) {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), code: code.trim() }),
        });
        const data = await res.json();
        if (data.success) {
          router.push(data.redirect || "/admin");
        } else {
          setError(data.error || "Invalid email or login code");
        }
      } catch (err: any) {
        setError(err.message || "Network error");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSentMessage(data.message);
        setVerifyUrl(data.verifyUrl);
      } else {
        setError(data.error || "Failed to send magic link");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDevLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "dev_bypass_token" }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Failed to execute quick dev login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-[#ECE6D8] rounded-[24px] p-8 shadow-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FDB91F] flex items-center justify-center text-[#1C1F3A] mx-auto shadow-md">
            <RobotIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-[#1C1F3A]">
              Founder Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[#4A4F66] mt-1">
              AgentWala OS · Automated Solo Agency
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            ⚠️ {error}
          </div>
        )}

        {sentMessage ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-[#E4F3EB] border border-[#BCE8B4] rounded-2xl space-y-2 text-center">
              <span className="w-8 h-8 rounded-full bg-[#1F7A3A] text-white flex items-center justify-center mx-auto text-sm font-bold">
                ✓
              </span>
              <p className="font-bold text-sm text-[#1F7A3A]">Magic Link Dispatched!</p>
              <p className="text-xs text-[#355E3B]">
                {sentMessage}
              </p>
            </div>

            {verifyUrl && (
              <div className="p-3 bg-[#FBF7EE] border border-[#ECE6D8] rounded-xl text-center space-y-2">
                <span className="text-[11px] font-bold text-[#9A6400] uppercase tracking-wider block">
                  🛠️ Dev Outbox Shortcut
                </span>
                <a
                  href={verifyUrl}
                  className="inline-block w-full py-2.5 px-4 bg-[#1C1F3A] hover:bg-[#14172C] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  Click to Authenticate Directly →
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSentMessage(null);
                setVerifyUrl(null);
              }}
              className="w-full text-center text-xs text-[#727791] hover:underline cursor-pointer"
            >
              ← Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1F3A] mb-1.5">
                Founder Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@agentwala.in"
                className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-sm text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1F3A] mb-1.5">
                Founder Login Code <span className="text-[#727791] font-normal">(Optional fallback)</span>
              </label>
              <input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter FOUNDER_LOGIN_CODE if Resend is pending"
                className="w-full h-11 px-3.5 rounded-xl border border-[#ECE6D8] bg-[#FBF7EE] text-sm text-[#1C1F3A] focus:outline-none focus:ring-2 focus:ring-[#FDB91F]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1C1F3A] font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading
                ? (code.trim() ? "Authenticating..." : "Generating Link...")
                : (code.trim() ? "Log In with Code →" : "Send Magic Login Link →")}
            </button>

            {/* Quick dev bypass button (hidden in production) */}
            {process.env.NODE_ENV !== "production" && (
              <div className="pt-2 border-t border-[#ECE6D8]">
                <button
                  type="button"
                  onClick={handleQuickDevLogin}
                  disabled={loading}
                  className="w-full py-2.5 bg-[#1C1F3A] hover:bg-[#14172C] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>⚡ 1-Click Instant Founder Login (Local QA)</span>
                </button>
              </div>
            )}
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-[#727791] hover:text-[#1C1F3A]">
            ← Return to public website
          </Link>
        </div>
      </div>
    </div>
  );
}

