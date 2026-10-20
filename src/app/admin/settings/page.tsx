"use client";

import React, { useEffect, useState } from "react";
import { SITE_CONFIG } from "@/content/site";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>(SITE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.settings) {
          setSettings(json.settings);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
          Agency Settings &amp; API Integrations
        </h1>
        <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
          Configure business registration, GST details, demo lines, and view integration status.
        </p>
      </div>

      {/* Integration Status Badges */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
          Active Integration Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Database", status: "Local DB (Zero-Key Active)", state: "good" },
            { label: "WhatsApp API", status: "Mock / Sandbox Mode", state: "mock" },
            { label: "Razorpay Payments", status: "Mock Mode Active", state: "mock" },
            { label: "Resend Email", status: "Mock Mode Active", state: "mock" },
            { label: "AI Engine", status: "Ready (Mock Fallback)", state: "good" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] space-y-1"
            >
              <span className="text-[11px] font-bold text-[#585D7A] dark:text-[#A6A9C6] block">
                {item.label}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.state === "good" ? "bg-[#2E7D5B]" : "bg-[#FDB91F]"
                  }`}
                />
                <span className="text-[#1B1F3B] dark:text-white truncate">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#727791] pt-1">
          💡 If any external API key is missing from <code>.env.local</code>, AgentWala OS automatically falls back to offline simulation and logs every transaction into the activity table.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-[#E2E0EE] dark:border-[#2F3356] pb-4">
          <h2 className="font-bold text-base text-[#1B1F3B] dark:text-white">
            Business &amp; Banking Details
          </h2>
          {savedSuccess && (
            <span className="text-xs font-bold text-[#2E7D5B]">
              ✓ Settings saved successfully
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              Legal Business Name
            </label>
            <input
              type="text"
              value={settings.LEGAL_NAME || ""}
              onChange={(e) => handleChange("LEGAL_NAME", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              GSTIN
            </label>
            <input
              type="text"
              value={settings.GSTIN || ""}
              onChange={(e) => handleChange("GSTIN", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              Demo Line Phone Number
            </label>
            <input
              type="text"
              value={settings.DEMO_NUMBER || ""}
              onChange={(e) => handleChange("DEMO_NUMBER", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              WhatsApp Support Number
            </label>
            <input
              type="text"
              value={settings.WHATSAPP_NUMBER || ""}
              onChange={(e) => handleChange("WHATSAPP_NUMBER", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              Founder Name
            </label>
            <input
              type="text"
              value={settings.FOUNDER_NAME || ""}
              onChange={(e) => handleChange("FOUNDER_NAME", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              City
            </label>
            <input
              type="text"
              value={settings.CITY || ""}
              onChange={(e) => handleChange("CITY", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              Cal.com 20-Min Booking Link
            </label>
            <input
              type="url"
              value={settings.BOOKING_LINK || ""}
              onChange={(e) => handleChange("BOOKING_LINK", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              UPI ID for Payments
            </label>
            <input
              type="text"
              value={settings.UPI_ID || ""}
              onChange={(e) => handleChange("UPI_ID", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
              Bank Account (HDFC Bank)
            </label>
            <input
              type="text"
              value={settings.ACCOUNT_NUMBER || ""}
              onChange={(e) => handleChange("ACCOUNT_NUMBER", e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#FDB91F] hover:bg-[#E5A413] text-[#1B1F3B] font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

