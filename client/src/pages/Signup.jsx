import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Heart, Mail, Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw]       = useState("");
  const [pw2, setPw2]     = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy]   = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) { setError("Passwords do not match."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }

    setBusy(true);
    const { data, error: err } = await signUp(email, pw, name);
    if (err) { setError(err.message); setBusy(false); return; }

    if (data?.user && !data.session) {
      toast.info("Check your email for a confirmation link, then sign in.");
      navigate("/login", { replace: true });
    } else {
      toast.success("Account created!");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:"1rem" }}>
      <div className="cu-card" style={{ width:"100%", maxWidth:420, padding:"2.5rem 2rem" }}>
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:48, height:48, borderRadius:12, background:"var(--teal-light)", marginBottom:"0.75rem" }}>
            <Heart size={24} style={{ color:"var(--teal)" }} />
          </div>
          <h1 style={{ fontSize:"1.5rem", fontWeight:700, color:"var(--text1)", margin:0 }}>Create your account</h1>
          <p style={{ fontSize:"0.875rem", color:"var(--text3)", marginTop:"0.25rem" }}>Get started with Curasana</p>
        </div>

        {error && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0.75rem 1rem", borderRadius:8, background:"#fef2f2", color:"#b91c1c", fontSize:"0.85rem", marginBottom:"1rem" }}>
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom:"1rem" }}>
            <label className="cu-label">Full Name</label>
            <div style={{ position:"relative" }}>
              <User size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="cu-input" style={{ paddingLeft:36 }} placeholder="Jane Doe" />
            </div>
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label className="cu-label">Email</label>
            <div style={{ position:"relative" }}>
              <Mail size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="cu-input" style={{ paddingLeft:36 }} placeholder="you@example.com" />
            </div>
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label className="cu-label">Password</label>
            <div style={{ position:"relative" }}>
              <Lock size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} className="cu-input" style={{ paddingLeft:36 }} placeholder="At least 6 characters" />
            </div>
          </div>
          <div style={{ marginBottom:"1.5rem" }}>
            <label className="cu-label">Confirm Password</label>
            <div style={{ position:"relative" }}>
              <Lock size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--text3)" }} />
              <input type="password" required minLength={6} value={pw2} onChange={(e) => setPw2(e.target.value)} className="cu-input" style={{ paddingLeft:36 }} placeholder="Repeat password" />
            </div>
          </div>
          <button type="submit" disabled={busy} className="cu-btn cu-btn-primary" style={{ width:"100%", justifyContent:"center" }}>
            {busy ? "Creating account…" : "Sign up"} {!busy && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{ textAlign:"center", fontSize:"0.85rem", color:"var(--text3)", marginTop:"1.5rem" }}>
          Already have an account? <Link to="/login" className="cu-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
