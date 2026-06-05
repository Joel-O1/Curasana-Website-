import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, requireRole, skipOnboardingCheck }) {
    const { user, loading } = useAuth();
    const loc = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
                <div className="text-sm" style={{ color: "var(--text3)" }} data-testid="auth-loading">Loading…</div>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
    }
    if (requireRole && user.role !== requireRole) {
        return <Navigate to={user.role === "doctor" ? "/doctor" : "/dashboard"} replace />;
    }
    if (!skipOnboardingCheck && user.role === "patient" && !user.onboarded) {
        return <Navigate to="/onboarding/profile" replace />;
    }
    return children;
}
