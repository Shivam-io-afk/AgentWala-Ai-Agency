import { RealtimeLoadingScreen } from "@/components/network-loading-indicator";

export default function PortalLoading() {
  return (
    <RealtimeLoadingScreen
      title="Securing Project Portal"
      subtext="Verifying client access token, loading Master Agreement & milestones..."
      fullScreen={true}
    />
  );
}

