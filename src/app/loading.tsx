import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function GlobalLoading() {
  return (
    <RealtimeLoadingScreen
      title="Loading Agmeta OS"
      subtext="Connecting to system pipeline and initializing environment..."
      fullScreen={true}
    />
  );
}

