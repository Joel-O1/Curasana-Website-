import { useEffect, useState } from "react";
import { User, MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import {
  getPatientProfile,
  parsePatientAddress,
  updatePatientMetrics,
} from "../lib/curasana-api";
import { SectionCard, SettingsBackLink } from "../components/settings/SettingsUI";

export default function SettingsPersonalInfo() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    dateOfBirth: "",
    heightCm: "",
    weightKg: "",
    streetAddress: "",
    city: "",
    province: "",
    postalCode: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.patientId) {
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPatientProfile(user.patientId);
        if (!active) return;

        const address = parsePatientAddress(data.location);
        setProfile({
          dateOfBirth: data.date_of_birth ? String(data.date_of_birth).slice(0, 10) : "",
          heightCm: data.height_cm != null ? String(data.height_cm) : "",
          weightKg: data.weight_kg != null ? String(data.weight_kg) : "",
          streetAddress: address.streetAddress,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        if (active) toast.error("Could not load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.patientId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user?.patientId) {
      toast.error("No patient profile found. Try signing out and back in.");
      return;
    }

    setSaving(true);
    try {
      await updatePatientMetrics(user.patientId, {
        date_of_birth: profile.dateOfBirth || null,
        height_cm: profile.heightCm,
        weight_kg: profile.weightKg,
        street_address: profile.streetAddress,
        city: profile.city,
        province: profile.province,
        postal_code: profile.postalCode,
      });
      toast.success("Personal information saved.");
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error(err.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveButton = (
    <button
      type="submit"
      className="cu-btn cu-btn-primary"
      disabled={loading || saving}
      style={{ opacity: loading || saving ? 0.65 : 1 }}
    >
      {saving ? (
        <>
          <Loader2 size={15} className="animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Save size={15} /> Save changes
        </>
      )}
    </button>
  );

  return (
    <div className="cu-fade-up" style={{ maxWidth: 620 }}>
      <SettingsBackLink />

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SectionCard
          icon={User}
          title="Personal Information"
          subtitle="Date of birth, height, and weight"
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--text3)",
                fontSize: 13,
              }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--teal)" }} />
              Loading profile…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ maxWidth: 280 }}>
                <label className="cu-label">Date of Birth</label>
                <input
                  type="date"
                  className="cu-input"
                  value={profile.dateOfBirth}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                  maxWidth: 420,
                }}
              >
                <div>
                  <label className="cu-label">Height (cm)</label>
                  <input
                    type="number"
                    min="0"
                    className="cu-input"
                    placeholder="e.g. 175"
                    value={profile.heightCm}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, heightCm: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="cu-label">Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    className="cu-input"
                    placeholder="e.g. 70"
                    value={profile.weightKg}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, weightKg: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={MapPin}
          title="Address"
          subtitle="Your home address for reports and records"
          footer={saveButton}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--text3)",
                fontSize: 13,
              }}
            >
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--teal)" }} />
              Loading profile…
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="cu-label">Street Address</label>
                <input
                  type="text"
                  className="cu-input"
                  placeholder="e.g. 123 Main Street"
                  value={profile.streetAddress}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, streetAddress: e.target.value }))
                  }
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                <div>
                  <label className="cu-label">City</label>
                  <input
                    type="text"
                    className="cu-input"
                    placeholder="e.g. Edmonton"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="cu-label">Province / State</label>
                  <input
                    type="text"
                    className="cu-input"
                    placeholder="e.g. AB"
                    value={profile.province}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, province: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div style={{ maxWidth: 200 }}>
                <label className="cu-label">Postal Code</label>
                <input
                  type="text"
                  className="cu-input"
                  placeholder="e.g. T5J 0A1"
                  value={profile.postalCode}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, postalCode: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </SectionCard>
      </form>
    </div>
  );
}
