"use client";

import React, { useEffect, useState } from "react";
import { AutomationSetting } from "@/lib/types";

export default function AdminAutomationsPage() {
  const [automations, setAutomations] = useState<AutomationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/admin/automations");
      const json = await res.json();
      if (json.success) {
        setAutomations(json.automations || []);
      }
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", id, enabled: !currentEnabled }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await fetch("/api/admin/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", id }),
      });
      fetchAutomations();
    } catch (err) {
      console.error("Failed to retry automation:", err);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-3xl text-[#1B1F3B] dark:text-white">
          Automations (A1–A20)
        </h1>
        <p className="text-xs sm:text-sm text-[#585D7A] dark:text-[#A6A9C6] mt-1">
          Every automation runs idempotently, logs to activity_log, and retries up to 3 times with backoff.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-[#585D7A]">
            Loading automations engine…
          </div>
        ) : (
          automations.map((auto) => (
            <div
              key={auto.id}
              className={`p-5 rounded-2xl border transition-all ${
                auto.enabled
                  ? "bg-white dark:bg-[#1C1F3A] border-[#E2E0EE] dark:border-[#2F3356] shadow-xs"
                  : "bg-[#F6F5FB] dark:bg-[#15172C] border-[#E2E0EE] dark:border-[#282B4B] opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FAF0D7] text-[#9A6400]">
                      {auto.id}
                    </span>
                    <h3 className="font-bold text-sm text-[#1B1F3B] dark:text-white">
                      {auto.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#585D7A] dark:text-[#A6A9C6] leading-relaxed">
                    {auto.description}
                  </p>
                </div>

                {/* On / Off Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(auto.id, auto.enabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 cursor-pointer ${
                    auto.enabled ? "bg-[#2E7D5B]" : "bg-[#A6A9C6]"
                  }`}
                  aria-label={`Toggle ${auto.name}`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      auto.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-[#E2E0EE] dark:border-[#2F3356] flex items-center justify-between text-[11px] text-[#585D7A] dark:text-[#A6A9C6]">
                <div className="flex items-center gap-3">
                  <span>
                    Success: <b className="font-mono text-[#2E7D5B]">{auto.success_count}</b>
                  </span>
                  <span>
                    Failed: <b className="font-mono text-[#B4540A]">{auto.failure_count}</b>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#727791]">
                    {auto.last_run
                      ? new Date(auto.last_run).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })
                      : "Active"}
                  </span>
                  <button
                    type="button"
                    disabled={retryingId === auto.id}
                    onClick={() => handleRetry(auto.id)}
                    className="px-2 py-0.5 rounded bg-[#E7E5F1] text-[#1B1F3B] hover:bg-[#D5D2E8] font-semibold text-[10.5px] cursor-pointer disabled:opacity-50"
                  >
                    {retryingId === auto.id ? "Running…" : "Trigger Run"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
