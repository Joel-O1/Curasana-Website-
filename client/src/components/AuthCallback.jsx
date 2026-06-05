import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const location = useLocation();
    const navigate = useNavigate();
    const { completeGoogleSession } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = location.hash || window.location.hash;
        const m = hash.match(/session_id=([^&]+)/);
        if (!m) {
            navigate("/login", { replace: true });
            return;
        }
        const sessionId = decodeURIComponent(m[1]);
        (async () => {
            try {
                const user = await completeGoogleSession(sessionId);
                // clear the hash
                window.history.replaceState(null, "", window.location.pathname);
                if (user.role === "doctor") {
                    navigate("/doctor", { replace: true });
                } else if (!user.onboarded) {
                    navigate("/onboarding/profile", { replace: true });
                } else {
                    navigate("/dashboard", { replace: true });
                }
                toast.success(`Welcome, ${user.name}`);
            } catch (e) {
                toast.error("Google sign-in failed", { description: "Please try again." });
                navigate("/login", { replace: true });
            }
        })();
    }, [location.hash, navigate, completeGoogleSession]);

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
            <div className="text-sm" style={{ color: "var(--text3)" }}>Completing sign-in…</div>
        </div>
    );
}
