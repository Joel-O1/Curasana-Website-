import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Heart, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const from = location.state?.from;

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr(""); setBusy(true);
        try {
            const u = await login(form.email, form.password);
            toast.success(`Welcome back, ${u.name}`);
            const dest = from || (
                u.role === "doctor" ? "/doctor"
                : !u.onboarded ? "/onboarding/profile"
                : "/dashboard"
            );
            navigate(dest, { replace: true });
        } catch (e) {
            setErr(e?.response?.data?.detail || "Login failed");
        } finally { setBusy(false); }
    };

    const onGoogle = () => {
        const redirectUrl = window.location.origin + "/auth/callback";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }} data-testid="login-page">
            <header className="px-6 md:px-12 py-5 max-w-7xl w-full mx-auto">
                <Link to="/" className="inline-flex items-center gap-2" data-testid="back-home">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--teal)" }}>
                        <Heart size={18} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div className="text-lg font-semibold" style={{ letterSpacing: "-0.02em" }}>Curasana</div>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-md cu-card cu-fade-up">
                    <h1 className="text-3xl font-semibold" style={{ letterSpacing: "-0.02em" }}>Welcome back</h1>
                    <p className="text-sm mt-1.5" style={{ color: "var(--text2)" }}>Log in to your Curasana account.</p>

                    <button type="button" onClick={onGoogle} className="cu-btn cu-btn-secondary justify-center mt-6" style={{ width: "100%", padding: "12px 16px", fontSize: 14 }} data-testid="google-login-btn">
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.6-21.3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/><path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.4 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12.1 12.1 0 0 1-4.1 5.5l6.2 5.2c-.4.4 6.6-4.9 6.6-14.7 0-1.3-.1-2.5-.4-3.5z"/></svg>
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        <span className="text-xs" style={{ color: "var(--text3)" }}>or with email</span>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="cu-label">Email</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text3)" />
                                <input className="cu-input" style={{ paddingLeft: 36 }} type="email" required
                                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="you@example.com" data-testid="login-email" />
                            </div>
                        </div>
                        <div>
                            <label className="cu-label">Password</label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="var(--text3)" />
                                <input className="cu-input" style={{ paddingLeft: 36 }} type="password" required
                                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••" data-testid="login-password" />
                            </div>
                        </div>
                        {err && (
                            <div className="flex items-start gap-2 p-2.5 rounded-xl text-xs" style={{ background: "var(--coral-light)", color: "var(--coral-d)" }} data-testid="login-error">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{err}</span>
                            </div>
                        )}
                        <button type="submit" className="cu-btn cu-btn-primary justify-center" style={{ width: "100%", padding: "12px 16px", fontSize: 14 }} disabled={busy} data-testid="login-submit">
                            {busy ? "Signing in…" : <>Log in <ArrowRight size={14} /></>}
                        </button>
                    </form>

                    <div className="text-center mt-5 text-sm" style={{ color: "var(--text2)" }}>
                        New to Curasana? <Link to="/signup" className="font-medium" style={{ color: "var(--teal-d)" }} data-testid="goto-signup">Create an account</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
