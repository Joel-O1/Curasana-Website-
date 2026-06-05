import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Heart, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <header style={{ borderBottom:"1px solid var(--border)", background:"var(--surface)", padding:"0.75rem 1.5rem" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:32, height:32, borderRadius:8, background:"var(--teal-light)" }}>
              <Heart size={16} style={{ color:"var(--teal)" }} />
            </div>
            <span style={{ fontWeight:700, fontSize:"1.1rem", color:"var(--text1)" }}>Curasana</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:"0.85rem", color:"var(--text3)" }}>{user?.email}</span>
            <button onClick={handleSignOut} className="cu-btn cu-btn-ghost" style={{ gap:6 }}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 65px)" }}>
        <div style={{ textAlign:"center" }}>
          <h2 style={{ fontSize:"1.75rem", fontWeight:700, color:"var(--text1)", margin:0 }}>Dashboard</h2>
          <p style={{ color:"var(--text3)", marginTop:"0.5rem", fontSize:"1rem" }}>
            Welcome{user?.name ? `, ${user.name}` : ""}! Your account is connected.
          </p>
        </div>
      </main>
    </div>
  );
}
