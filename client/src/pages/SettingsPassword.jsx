import { useState } from "react";
import { Lock, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { validatePassword } from "../lib/passwordValidation";
import { SectionCard, PasswordField, SettingsBackLink } from "../components/settings/SettingsUI";

export default function SettingsPassword() {
  const { user, changePassword, requestPasswordReset } = useAuth();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const onForgotPassword = async () => {
    if (!user?.email) {
      toast.error("You must be logged in to request a password reset.");
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await requestPasswordReset(user.email);
      if (error) {
        toast.error(error.message || "Could not send reset email.");
        return;
      }

      toast.success(`Password reset email sent to ${user.email}. Check your inbox.`);
    } catch (err) {
      console.error("Password reset email failed:", err);
      toast.error("Could not send reset email.");
    } finally {
      setSendingReset(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error("You must be logged in to change your password.");
      return;
    }

    if (!pw.current) {
      toast.error("Enter your current password.");
      return;
    }

    const validation = validatePassword(pw.next, pw.confirm);
    if (!validation.allMet) {
      toast.error(validation.firstError ?? "Please meet all password requirements.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await changePassword(user.email, pw.current, pw.next);
      if (error) {
        toast.error(error.message || "Could not update password.");
        return;
      }

      toast.success("Password updated. Use your new password next time you sign in.");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      console.error("Password update failed:", err);
      toast.error("Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cu-fade-up" style={{ maxWidth: 620 }}>
      <SettingsBackLink />

      <form onSubmit={onSubmit}>
        <SectionCard
          icon={Lock}
          title="Change Password"
          subtitle="Updates your login password for this account"
          footer={
            <button
              type="submit"
              className="cu-btn cu-btn-primary"
              disabled={saving}
              style={{ opacity: saving ? 0.65 : 1 }}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Updating…
                </>
              ) : (
                <>
                  <Save size={15} /> Update password
                </>
              )}
            </button>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 420,
            }}
          >
            <PasswordField
              label="Current Password"
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={sendingReset || saving}
                className="cu-link"
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  fontSize: 12,
                  cursor: sendingReset || saving ? "not-allowed" : "pointer",
                  opacity: sendingReset || saving ? 0.65 : 1,
                }}
              >
                {sendingReset ? "Sending reset email…" : "Forgot password?"}
              </button>
            </div>
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
              Passwords are stored securely in Supabase Auth and used when you log in.
            </p>
          </div>
        </SectionCard>
      </form>
    </div>
  );
}
