import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Heart } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"var(--bg)" }}>
        <Heart size={32} style={{ color:"var(--teal)" }} />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
