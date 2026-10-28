"use client";

import React, { useEffect, useState } from "react";
import { SITE_CONFIG } from "@/content/site";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>(SITE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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
          Configure package prices (single source of truth), GST switch, business registration, and reset demo data.
        </p>
      </div>

      {/* GST Registration Switch Card */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base text-[#1B1F3B] dark:text-white">
              GST Registration Switch
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
              Controls GST inclusion across public site, admin revenue totals, invoices, and proposals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = !settings.gst_registered;
              setSettings((prev) => ({ ...prev, gst_registered: updated }));
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.gst_registered ? "bg-[#2E7D5B]" : "bg-[#A6A9C6]"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.gst_registered ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#F6F5FB] dark:bg-[#12142A] border border-[#E2E0EE] dark:border-[#2F3356] text-xs">
          {settings.gst_registered ? (
            <span className="font-semibold text-[#2E7D5B]">
              ✓ GST is ON (18% applied to invoices, split 9% CGST + 9% SGST intra-state, or 18% IGST inter-state).
            </span>
          ) : (
            <span className="font-semibold text-[#585D7A] dark:text-[#A6A9C6]">
              ○ GST is OFF (Unregistered / Composition dealer — 0% tax. All mentions of &quot;incl. 18% GST&quot; hidden).
            </span>
          )}
        </div>
      </div>

      {/* Package Prices: Single Source of Truth */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-[#E2E0EE] dark:border-[#2F3356] rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="font-bold text-base text-[#1B1F3B] dark:text-white">
            Package Pricing (Single Source of Truth)
          </h2>
          <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
            Updates made here instantly update the public site pricing cards and the &quot;Add Lead&quot; dropdown.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Growth (AI Receptionist)
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Setup Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.growth_setup ?? 35000}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, growth_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Monthly Retainer (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.growth_monthly ?? 19999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, growth_monthly: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Starter (WhatsApp Bot)
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Setup Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.starter_setup ?? 15000}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, starter_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Monthly Retainer (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.starter_monthly ?? 7999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, starter_monthly: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Pro (Multi-Branch)
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Setup Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.pro_setup ?? 75000}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, pro_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Monthly Retainer (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.pro_monthly ?? 49999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, pro_monthly: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Business Website
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Project Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.business_website_setup ?? 59999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, business_website_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Mobile App MVP
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Project Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.app_mvp_setup ?? 299999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, app_mvp_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E2E0EE] dark:border-[#2F3356] bg-[#F6F5FB] dark:bg-[#12142A] space-y-3">
            <span className="font-bold text-sm text-[#1B1F3B] dark:text-white block">
              Website Launch
            </span>
            <div>
              <label className="text-[11px] text-[#585D7A] dark:text-[#A6A9C6] block mb-1">
                Project Fee (₹)
              </label>
              <input
                type="number"
                value={settings.package_prices?.website_launch_setup ?? 24999}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSettings((prev) => ({
                    ...prev,
                    package_prices: { ...prev.package_prices, website_launch_setup: val },
                  }));
                }}
                className="w-full h-9 px-3 rounded-lg border border-[#E2E0EE] dark:border-[#2F3356] bg-white dark:bg-[#1C1F3A] font-mono text-xs font-bold"
              />
            </div>
          </div>
        </div>
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
          💡 If any external API key is missing from <code>.env.local</code>, Agmeta OS automatically falls back to offline simulation and logs every transaction into the activity table.
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

      {/* Danger Zone: Reset Demo Data */}
      <div className="bg-white dark:bg-[#1C1F3A] border border-red-200 dark:border-red-950/40 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-base text-red-600 dark:text-red-400">
              Reset Demo Data
            </h2>
            <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] mt-0.5">
              Wipes all test projects and re-seeds the exact 3 seed projects (Dr. Vikram Mehta - Lead, Dr. Rohini Batra - Proposal sent, Amitabh Sen - Handed over).
            </p>
          </div>
          <button
            type="button"
            disabled={resetting}
            onClick={async () => {
              if (!confirm("Are you sure you want to reset demo data? This resets the DB to the 3 clean Example projects.")) return;
              setResetting(true);
              setResetSuccess(false);
              try {
                const res = await fetch("/api/dev/reset", { method: "POST" });
                const json = await res.json();
                if (json.success) {
                  setResetSuccess(true);
                  setTimeout(() => setResetSuccess(false), 3000);
                  window.location.reload();
                }
              } catch (err) {
                console.error("Failed to reset:", err);
              } finally {
                setResetting(false);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Reset Demo Data"}
          </button>
        </div>
        {resetSuccess && (
          <p className="text-xs font-bold text-[#2E7D5B]">
            ✓ Demo data cleanly re-seeded to 3 Example projects.
          </p>
        )}
      </div>
    </div>
  );
}

