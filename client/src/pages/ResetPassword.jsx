import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Lock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import { validatePassword } from "../lib/passwordValidation";
import { PasswordField } from "../components/settings/SettingsUI";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    let resolved = false;

    const finish = (isValid) => {
      if (!active || resolved) return;
      resolved = true;
      setReady(isValid);
      setInvalidLink(!isValid);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        finish(true);
      }
    });

    const hash = window.location.hash;
    const hasRecoveryHash =
      hash.includes("type=recovery") || hash.includes("access_token");

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        finish(true);
        return;
      }
      if (!hasRecoveryHash) {
        finish(false);
      }
    });

    const timeout = window.setTimeout(() => {
      finish(false);
    }, 8000);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    const validation = validatePassword(pw.next, pw.confirm);
    if (!validation.allMet) {
      toast.error(validation.firstError ?? "Please meet all password requirements.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) {
        toast.error(error.message || "Could not update password.");
        return;
      }

      toast.success("Password updated. Sign in with your new password.");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Password reset failed:", err);
      toast.error("Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "1rem",
      }}
    >
      <div className="cu-card" style={{ width: "100%", maxWidth: 420, padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "var(--teal-light)",
              marginBottom: "0.75rem",
            }}
          >
            <Heart size={24} style={{ color: "var(--teal)" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text1)", margin: 0 }}>
            Reset password
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text3)", marginTop: "0.25rem" }}>
            Choose a new password for your Curasana account
          </p>
        </div>

        {!ready && !invalidLink && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: "var(--text3)",
              fontSize: 14,
              padding: "1rem 0",
            }}
          >
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--teal)" }} />
            Verifying reset link…
          </div>
        )}

        {invalidLink && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--text3)", lineHeight: 1.6 }}>
              This reset link is invalid or has expired. Request a new one from Settings or sign in.
            </p>
            <Link to="/login" className="cu-link" style={{ fontSize: 14 }}>
              Back to sign in
            </Link>
          </div>
        )}

        {ready && (
          <form onSubmit={onSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <PasswordField
                label="New Password"
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                placeholder="Create a new password"
              />
              <PasswordField
                label="Confirm New Password"
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Repeat new password"
              />
              <p style={{ margin: 0, fontSize: 12, color: "var(--text3)", lineHeight: 1.5 }}>
                Must be at least 12 characters with uppercase, a number, and a special character.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="cu-btn cu-btn-primary"
              style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Updating…
                </>
              ) : (
                <>
                  <Save size={16} /> Update password
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
