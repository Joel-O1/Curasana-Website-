import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import useTimelineData from "../hooks/useTimelineData";
import HealthTimeline from "../components/HealthTimeline";
import CenteredCard from "./Dashboard"; // Use your shared component

export default function Analytics() {
  const { user } = useAuth();
  const { events, medications, loading, error } = useTimelineData(
    user?.patientId,
    user?.dbId
  );

  if (loading) return (
    <CenteredCard>
      <Loader2 size={32} className="animate-spin" style={{ color: "var(--teal)" }} />
      <p>Loading events...</p>
    </CenteredCard>
  );

  if (error) return (
    <CenteredCard>
      <AlertCircle size={32} style={{ color: "var(--coral)" }} />
      <p>Error: {error}</p>
    </CenteredCard>
  );

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Health Events</h2>
      {/* You can pass specific props here if you want to filter the data further */}
      <HealthTimeline events={events} medications={medications} />
    </div>
  );
}