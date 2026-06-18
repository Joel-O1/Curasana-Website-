import { useAuth } from "../contexts/AuthContext";
import HealthTimeline from "../components/HealthTimeline";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <HealthTimeline userId={user?.dbId} userEmail={user?.email} />
  );
}
