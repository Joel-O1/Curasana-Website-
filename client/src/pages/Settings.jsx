import { User, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SettingsNavRow } from "../components/settings/SettingsUI";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="cu-fade-up" style={{ maxWidth: 620 }}>
      <div
        className="cu-card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="cu-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
          {(user?.name || "U")
            .split(" ")
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
            {user?.name || "Your account"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text3)" }}>{user?.email}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="cu-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px 10px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text3)",
            }}
          >
            Account
          </div>
          <SettingsNavRow
            to="/settings/personal-info"
            icon={User}
            title="Personal Information"
            subtitle="Date of birth, height, weight, and address"
          />
          <SettingsNavRow
            to="/settings/password"
            icon={Lock}
            title="Change Password"
            subtitle="Update your login password"
          />
        </div>

        <div className="cu-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px 10px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text3)",
            }}
          >
            Legal
          </div>
          <SettingsNavRow
            to="/settings/legal"
            icon={ShieldCheck}
            title="Legal & Privacy"
            subtitle="Terms of service and data practices"
          />
        </div>
      </div>
    </div>
  );
}
