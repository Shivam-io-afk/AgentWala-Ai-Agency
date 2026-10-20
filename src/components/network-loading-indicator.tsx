"use client";

import React, { useEffect, useState, createContext, useContext } from "react";

export interface NetworkLogItem {
  id: string;
  method: string;
  url: string;
  shortUrl: string;
  status?: number;
  durationMs?: number;
  state: "requesting" | "waiting" | "responding" | "success" | "error";
  startedAt: number;
}

interface NetworkContextType {
  activeCount: number;
  currentRequest: NetworkLogItem | null;
  recentLogs: NetworkLogItem[];
  isLoading: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  activeCount: 0,
  currentRequest: null,
  recentLogs: [],
  isLoading: false,
});

export function useNetworkActivity() {
  return useContext(NetworkContext);
}

export function NetworkLoadingProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);
  const [currentRequest, setCurrentRequest] = useState<NetworkLogItem | null>(null);
  const [recentLogs, setRecentLogs] = useState<NetworkLogItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const input = args[0];
      const init = args[1];
      const method = (init?.method || "GET").toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      const shortUrl = url.replace(/^https?:\/\/[^/]+/, "");

      // Ignore next.js internal hot-reloads / telemetry to avoid noise
      if (shortUrl.includes("/_next/") || shortUrl.includes("__next")) {
        return originalFetch.apply(window, args);
      }

      const id = "req_" + Math.random().toString(36).substring(2, 9);
      const startTime = performance.now();

      const logItem: NetworkLogItem = {
        id,
        method,
        url,
        shortUrl,
        state: "requesting",
        startedAt: Date.now(),
      };

      setActiveCount((prev) => prev + 1);
      setCurrentRequest(logItem);
      setRecentLogs((prev) => [logItem, ...prev.slice(0, 9)]);

      // Transition to waiting after brief instant
      const waitingTimer = setTimeout(() => {
        setCurrentRequest((curr) => (curr?.id === id ? { ...curr, state: "waiting" } : curr));
        setRecentLogs((prev) =>
          prev.map((item) => (item.id === id ? { ...item, state: "waiting" } : item))
        );
      }, 80);

      try {
        const response = await originalFetch.apply(window, args);
        clearTimeout(waitingTimer);
        const durationMs = Math.round(performance.now() - startTime);

        const updatedItem: NetworkLogItem = {
          ...logItem,
          status: response.status,
          durationMs,
          state: response.ok ? "success" : "error",
        };

        setActiveCount((prev) => Math.max(0, prev - 1));
        setCurrentRequest((curr) => (curr?.id === id ? updatedItem : curr));
        setRecentLogs((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );

        return response;
      } catch (err) {
        clearTimeout(waitingTimer);
        const durationMs = Math.round(performance.now() - startTime);

        const updatedItem: NetworkLogItem = {
          ...logItem,
          durationMs,
          state: "error",
        };

        setActiveCount((prev) => Math.max(0, prev - 1));
        setCurrentRequest((curr) => (curr?.id === id ? updatedItem : curr));
        setRecentLogs((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );

        throw err;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Top progress bar physics
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCount > 0) {
      setProgress((prev) => (prev < 20 ? 25 : prev < 70 ? prev + 15 : prev < 90 ? prev + 3 : prev));
      timer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + (85 - prev) * 0.15 : prev));
      }, 200);
    } else {
      if (progress > 0) {
        setProgress(100);
        timer = setTimeout(() => {
          setProgress(0);
        }, 350);
      }
    }
    return () => clearInterval(timer);
  }, [activeCount]);

  const isLoading = activeCount > 0;

  return (
    <NetworkContext.Provider value={{ activeCount, currentRequest, recentLogs, isLoading }}>
      {/* Top Animated Progress Bar */}
      {progress > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] bg-transparent overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FDB91F] via-[#FFD066] to-[#FDB91F] transition-all duration-300 ease-out shadow-[0_0_10px_#FDB91F]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {children}

      {/* Floating Real-Time Request / Response Telemetry Pill */}
      <div className="fixed bottom-3 right-3 z-50 font-sans text-xs select-none">
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer ${
              isLoading
                ? "bg-[#1C1F3A]/95 text-white border-[#FDB91F] shadow-[#FDB91F]/20"
                : recentLogs.length > 0 && recentLogs[0].state === "error"
                ? "bg-[#7A1F1F]/95 text-white border-[#E26D6D]"
                : "bg-white/90 text-[#1C1F3A] border-[#ECE6D8] hover:bg-white"
            }`}
          >
            {isLoading ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#FDB91F] animate-ping" />
                <span className="font-semibold text-[11px] text-[#FDB91F]">
                  {currentRequest?.state === "requesting"
                    ? "REQ SENDING"
                    : "WAITING RESP"}
                </span>
                <span className="font-mono text-[11px] text-gray-300 max-w-[140px] truncate">
                  {currentRequest?.method} {currentRequest?.shortUrl}
                </span>
              </>
            ) : (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    recentLogs.length > 0 && recentLogs[0].state === "error"
                      ? "bg-red-500"
                      : "bg-[#1F7A3A]"
                  }`}
                />
                <span className="font-medium text-[11px] text-[#4A4F66]">
                  {recentLogs.length > 0
                    ? `${recentLogs[0].status || "200"} OK (${recentLogs[0].durationMs || 0}ms)`
                    : "Real-time Telemetry"}
                </span>
              </>
            )}
            <span className="text-[10px] text-[#727791] font-mono pl-1 border-l border-gray-300">
              ⚡
            </span>
          </button>
        ) : (
          <div className="bg-[#1C1F3A] text-white border border-[#2F3356] rounded-xl shadow-2xl p-3 w-80 max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#2F3356] mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLoading ? "bg-[#FDB91F] animate-pulse" : "bg-[#1F7A3A]"
                  }`}
                />
                <span className="font-bold text-[11px] text-white tracking-wide uppercase">
                  Network Telemetry
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#A5A9C0] font-mono">
                  {activeCount} active
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white px-1 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Current Request State */}
            {isLoading && currentRequest ? (
              <div className="bg-[#24284A] border border-[#FDB91F]/40 rounded-lg p-2 mb-2">
                <div className="flex items-center justify-between text-[10px] text-[#FDB91F] font-bold">
                  <span className="flex items-center gap-1">
                    <span className="animate-spin text-xs">⏳</span>
                    {currentRequest.state === "requesting"
                      ? "Transmitting Request..."
                      : "Awaiting Server Response..."}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider bg-[#FDB91F]/20 px-1.5 py-0.5 rounded">
                    In Flight
                  </span>
                </div>
                <div className="font-mono text-[11px] text-gray-200 mt-1 truncate">
                  <span className="font-bold text-[#FFD066]">{currentRequest.method}</span>{" "}
                  {currentRequest.shortUrl}
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 py-1 flex items-center justify-between">
                <span>System Idle</span>
                <span className="text-[10px] text-[#1F7A3A] font-semibold">● Ready</span>
              </div>
            )}

            {/* Recent requests log */}
            <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Recent Traffic
              </div>
              {recentLogs.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic">No network calls yet</div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-[10px] py-1 border-b border-[#24284A] font-mono"
                  >
                    <div className="truncate max-w-[170px]">
                      <span
                        className={
                          log.method === "POST"
                            ? "text-[#FDB91F]"
                            : log.method === "GET"
                            ? "text-blue-400"
                            : "text-purple-400"
                        }
                      >
                        {log.method}
                      </span>{" "}
                      <span className="text-gray-300">{log.shortUrl}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-right pl-2">
                      <span
                        className={
                          log.state === "error"
                            ? "text-red-400 font-bold"
                            : log.state === "success"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {log.status || (log.state === "waiting" ? "..." : "ok")}
                      </span>
                      {log.durationMs !== undefined && (
                        <span className="text-gray-400 text-[9px]">
                          {log.durationMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </NetworkContext.Provider>
  );
}

/**
 * Reusable full-screen or section loading screen with real-time feedback
 */
export function RealtimeLoadingScreen({
  title = "Connecting to AgentWala OS",
  subtext = "Syncing pipeline records and verifying state...",
  fullScreen = true,
}: {
  title?: string;
  subtext?: string;
  fullScreen?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Establishing secure connection to database...",
    "Retrieving pipeline states and stage indexes...",
    "Syncing milestone invoices and GST parameters...",
    "Checking automation triggers and spending caps...",
    "Loading dashboard workspace...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(timer);
  }, [steps.length]);

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 bg-[#FBF7EE] flex items-center justify-center p-4"
    : "w-full py-16 flex items-center justify-center p-4 bg-[#FBF7EE]/60 rounded-2xl border border-[#ECE6D8]";

  return (
    <div className={containerClasses}>
      <div className="max-w-md w-full bg-white border border-[#ECE6D8] rounded-[20px] p-8 shadow-xl text-center space-y-6">
        {/* Animated Brand Pulse Icon */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-2xl bg-[#FDB91F]/30 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#FDB91F] flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-[#1C1F3A] animate-pulse"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16" />
              <line x1="16" y1="16" x2="16" y2="16" />
            </svg>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-xl text-[#1C1F3A]">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#4A4F66]">{subtext}</p>
        </div>

        {/* Real-Time Loading Step Ticker */}
        <div className="bg-[#FBF7EE] border border-[#ECE6D8] rounded-xl p-3.5 text-left space-y-2">
          <div className="flex items-center justify-between text-[11px] text-[#727791] font-mono">
            <span className="font-bold text-[#1C1F3A]">REAL-TIME TELEMETRY</span>
            <span className="text-[#9A6400] font-semibold">
              Step {stepIndex + 1} of {steps.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1F7A3A] animate-pulse" />
            <span className="text-xs font-medium text-[#1C1F3A] truncate">
              {steps[stepIndex]}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-[#ECE6D8] rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#FDB91F] transition-all duration-500 rounded-full"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Bottom micro-info */}
        <div className="text-[11px] text-[#727791] font-mono flex items-center justify-between pt-1 border-t border-[#ECE6D8]">
          <span>Server: IST (Asia/Kolkata)</span>
          <span className="text-[#1F7A3A] font-semibold">✓ SSL Verified</span>
        </div>
      </div>
    </div>
  );
}

