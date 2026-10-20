import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function AdminLoading() {
  return (
    <div className="max-w-[1240px] mx-auto p-4 sm:p-8 space-y-8">
      {/* Real-time telemetry loading banner */}
      <RealtimeLoadingScreen
        title="Loading Admin Command Workspace"
        subtext="Fetching live pipeline cards, revenue charts, spending caps, and Copilot tasks..."
        fullScreen={false}
      />

      {/* Skeleton placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#ECE6D8]/50 rounded-2xl border border-[#ECE6D8]" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 h-72 bg-[#ECE6D8]/40 rounded-2xl border border-[#ECE6D8]" />
        <div className="h-72 bg-[#ECE6D8]/40 rounded-2xl border border-[#ECE6D8]" />
      </div>
    </div>
  );
}

