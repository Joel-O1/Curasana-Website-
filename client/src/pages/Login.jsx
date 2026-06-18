import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Heart, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import GoogleSignInButton, { AuthDivider } from "../components/GoogleSignInButton";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState(null);
  const [busy, setBusy]         = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signIn(email, password);
    if (err) { setError(err.message); setBusy(false); }
    else { toast.success("Welcome back!"); navigate(from, { replace: true }); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:"1rem" }}>
      <div className="cu-card" style={{ width:"100%", maxWidth:420, padding:"2.5rem 2rem" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:48, height:48, borderRadius:12, background:"var(--teal-light)", marginBottom:"0.75rem" }}>
            <Heart size={24} style={{ color:"var(--teal)" }} />
          </div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:"var(--text1)", margin:0 }}>Welcome back</h1>
          <p style={{ fontSize:"0.875rem", color:"var(--text3)", marginTop:"0.25rem" }}>Sign in to your Curasana account</p>
        </div>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0.75rem 1rem", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:"0.85rem", marginBottom:"1rem" }}>
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom:"1rem" }}>
            <label className="cu-label">Email</label>
            <div style={{ position:"relative" }}>
              <Mail size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="cu-input" style={{ paddingLeft:36 }} placeholder="you@example.com" />
            </div>
          </div>
          <div style={{ marginBottom:"1.5rem" }}>
            <label className="cu-label">Password</label>
            <div style={{ position:"relative" }}>
              <Lock size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="cu-input" style={{ paddingLeft:36, paddingRight:40 }} placeholder="••••••••" />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", justifyContent:"center", padding:4, border:"none", background:"transparent", color:"var(--text3)", cursor:"pointer" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={busy} className="cu-btn cu-btn-primary" style={{ width:"100%", justifyContent:"center" }}>
            {busy ? "Signing in…" : "Sign in"} {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <AuthDivider />
        <GoogleSignInButton label="Sign in with Google" />

        <p style={{ textAlign:"center", fontSize:"0.85rem", color:"var(--text3)", marginTop:"1.5rem" }}>
          Don’t have an account? <Link to="/signup" className="cu-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
