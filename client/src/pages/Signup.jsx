import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Heart, Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Check, Circle,
} from "lucide-react";
import { toast } from "sonner";
import { getPasswordStrength, validatePassword } from "../lib/passwordValidation";
import GoogleSignInButton, { AuthDivider } from "../components/GoogleSignInButton";

function RequirementItem({ met, label }) {
  return (
    <li className="flex items-center gap-2 text-xs" style={{ color: met ? "var(--teal)" : "var(--text3)" }}>
      {met ? <Check size={12} /> : <Circle size={12} />} {label}
    </li>
  );
}

function PasswordStrengthMeter({ strength, visible }) {
  if (!visible) return null;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: "var(--text3)" }}>Password strength</span>
        <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: strength.percent + "%", background: strength.color }} />
      </div>
    </div>
  );
}

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validation = useMemo(() => validatePassword(pw, pw2), [pw, pw2]);
  const strength = useMemo(
    () => getPasswordStrength(validation.checks, validation.allMet),
    [validation.checks, validation.allMet]
  );

  const showPasswordFeedback = pw.length > 0 || submitAttempted;
  const confirmMismatch = pw2.length > 0 && pw !== pw2;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);
    if (!validation.allMet) {
      setError(validation.firstError ?? "Please meet all password requirements.");
      return;
    }
    setBusy(true);
    const { data, error: err } = await signUp(email, pw, firstName.trim(), lastName.trim());
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    if (data?.user && !data.session) {
      toast.info("Check your email for a confirmation link, then sign in.");
      navigate("/login", { replace: true });
    } else {
      toast.success("Account created!");
      navigate("/onboarding", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="cu-card w-full" style={{ maxWidth: 440 }}>
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--teal)" }}>
            <Heart size={18} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-center" style={{ letterSpacing: "-0.02em" }}>Create your account</h2>
        <p className="text-sm text-center mt-1 mb-6" style={{ color: "var(--text2)" }}>Get started with Curasana</p>

        <GoogleSignInButton />
        <AuthDivider />

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm" style={{ background: "#FEF2F2", color: "#DC2626" }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="cu-label">First Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
                <input type="text" required value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="cu-input" style={{ paddingLeft: 36 }}
                  placeholder="Jane" autoComplete="given-name" />
              </div>
            </div>
            <div>
              <label className="cu-label">Last Name</label>
              <input type="text" required value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="cu-input" placeholder="Doe" autoComplete="family-name" />
            </div>
          </div>

          <div>
            <label className="cu-label">Email</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cu-input" style={{ paddingLeft: 36 }}
                placeholder="you@example.com" />
            </div>
          </div>

          <div>
            <label className="cu-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input type={showPw ? "text" : "password"} required value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="cu-input" style={{ paddingLeft: 36, paddingRight: 40 }}
                placeholder="Create a strong password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, border: "none", background: "transparent", color: "var(--text3)", cursor: "pointer" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrengthMeter strength={strength} visible={showPasswordFeedback} />
            {showPasswordFeedback && (
              <ul className="mt-2 space-y-1">
                {validation.checks.map((check) => (
                  <RequirementItem key={check.key} met={check.met} label={check.label} />
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="cu-label">Confirm Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input type={showPw2 ? "text" : "password"} required value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="cu-input" style={{ paddingLeft: 36, paddingRight: 40, borderColor: confirmMismatch ? "#fca5a5" : undefined }}
                placeholder="Repeat password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw2((v) => !v)}
                aria-label={showPw2 ? "Hide password" : "Show password"}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, border: "none", background: "transparent", color: "var(--text3)", cursor: "pointer" }}>
                {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmMismatch && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "#EF4444" }}>
                <AlertCircle size={12} /> Passwords do not match.
              </div>
            )}
          </div>

          <button type="submit" disabled={busy}
            className="cu-btn cu-btn-primary justify-center" style={{ width: "100%", marginTop: 8 }}>
            {busy ? "Creating account…" : "Sign up"} {!busy && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="text-center mt-5 text-sm" style={{ color: "var(--text3)" }}>
          Already have an account?{" "}
          <Link to="/login" className="cu-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
