import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Pill, AlertCircle, Brain, FileText, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleStart = () => {
        if (user) {
            navigate("/dashboard");
        } else {
            navigate("/signup");
        }
    };

    const features = [
        { Icon: Activity, color: "var(--coral)", bg: "var(--coral-light)", title: "Track Symptoms", desc: "Pain scale, severity, notes, every entry timestamped." },
        { Icon: Pill, color: "var(--teal)", bg: "var(--teal-light)", title: "Manage Medications", desc: "Daily checklist, adherence stats, prescription log." },
        { Icon: AlertCircle, color: "var(--amber)", bg: "var(--amber-light)", title: "Allergy Registry", desc: "Emergency-ready record of every allergen and reaction." },
        { Icon: Brain, color: "var(--purple)", bg: "var(--purple-light)", title: "ML Insights", desc: "Statistical correlations between symptoms and triggers." },
        { Icon: FileText, color: "var(--blue)", bg: "var(--blue-light)", title: "Doctor Reports", desc: "One-click PDF summaries ready for your care team." },
        { Icon: ShieldCheck, color: "var(--teal-d)", bg: "var(--teal-light)", title: "Privacy First", desc: "You own your data. Anonymized when shared." },
    ];

    return (
        <div className="min-h-screen" style={{ background: "var(--bg)" }} data-testid="landing-page">
            {/* Nav */}
            <header className="px-6 md:px-12 py-5 flex items-center justify-between max-w-7xl mx-auto">
                <Link to="/" className="flex items-center gap-2" data-testid="landing-brand">
                    <img src="/logo.png" alt="Curasana" className="h-12 w-12 rounded-xl" />
                    <div>
                        <div className="text-lg font-semibold" style={{ letterSpacing: "-0.02em" }}>Curasana</div>
                        <div className="text-[10px]" style={{ color: "var(--text3)" }}>HEALTH PLATFORM</div>
                    </div>
                </Link>
                <nav className="flex items-center gap-2">
                    <Link to="/login" className="cu-btn cu-btn-ghost" data-testid="landing-login-link">Log in</Link>
                    <Link to="/signup" className="cu-btn cu-btn-primary" data-testid="landing-signup-link">
                        Get Started <ArrowRight size={14} />
                    </Link>
                </nav>
            </header>

            {/* Hero */}
            <section className="relative px-6 md:px-12 pt-12 pb-24 max-w-7xl mx-auto overflow-hidden">
                {/* floating decorative blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40 blur-3xl pointer-events-none animate-pulse-slow"
                    style={{ background: "var(--teal-light)" }} />
                <div className="absolute -bottom-20 left-12 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none animate-pulse-slow"
                    style={{ background: "var(--purple-light)", animationDelay: "1.4s" }} />

                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 cu-fade-up">
                        <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full" style={{ background: "var(--teal-light)" }}>
                            <Sparkles size={12} color="var(--teal-d)" />
                            <span className="text-xs font-medium" style={{ color: "var(--teal-d)" }}>Built for patients and clinicians</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05]" style={{ letterSpacing: "-0.035em" }}>
                            Your health,
                            <br />
                            <span style={{ color: "var(--teal)" }}>understood.</span>
                        </h1>
                        <p className="text-lg mt-6 max-w-xl" style={{ color: "var(--text2)" }}>
                            Track symptoms, medications, allergies and appointments. Then watch Curasana surface patterns
                            you'd never spot yourself. Share clinical-grade reports with your doctor in one click.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={handleStart}
                                className="cu-btn cu-btn-primary text-base"
                                style={{ padding: "14px 22px", fontSize: 15 }}
                                data-testid="get-started-btn"
                            >
                                Get Started <ArrowRight size={16} />
                            </button>
                            <Link to="/login" className="cu-btn cu-btn-ghost" style={{ padding: "14px 22px", fontSize: 14 }} data-testid="landing-existing-login">
                                I already have an account
                            </Link>
                        </div>
                        <div className="mt-8 flex items-center gap-6 text-xs" style={{ color: "var(--text3)" }}>
                            <span className="flex items-center gap-1.5"><ShieldCheck size={12} /> End-to-end private</span>
                            <span>Built for patients</span>
                            <span>Free during beta</span>
                        </div>
                    </div>

                    {/* Hero card */}
                    <div className="lg:col-span-5 cu-fade-up" style={{ animationDelay: "120ms" }}>
                        <div className="relative">
                            <div className="cu-card animate-float" style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.10)" }}>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="text-xs font-medium" style={{ color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Health Score</div>
                                        <div className="cu-stat-num mt-1">87<span className="text-base font-normal" style={{ color: "var(--text3)" }}>/100</span></div>
                                    </div>
                                    <span className="cu-pill cu-pill-teal">Excellent</span>
                                </div>
                                <div className="cu-progress mb-5"><div className="cu-progress-fill" style={{ width: "87%" }} /></div>
                                <div className="space-y-2.5">
                                    {[
                                        { Icon: Activity, c: "var(--coral)", bg: "var(--coral-light)", t: "Migraine", s: "Mild 2/10", time: "9:14 AM" },
                                        { Icon: Pill, c: "var(--teal)", bg: "var(--teal-light)", t: "Vitamin D3 taken", s: "2000 IU", time: "8:00 AM" },
                                        { Icon: Brain, c: "var(--purple)", bg: "var(--purple-light)", t: "Pattern detected", s: "Headache: Pollen", time: "Today" },
                                    ].map((it, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "var(--gray-soft)" }}>
                                            <div className="cu-stat-icon" style={{ background: it.bg, width: 34, height: 34 }}>
                                                <it.Icon size={15} color={it.c} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium">{it.t}</div>
                                                <div className="text-[11px]" style={{ color: "var(--text3)" }}>{it.s}</div>
                                            </div>
                                            <div className="text-[10px]" style={{ color: "var(--text3)" }}>{it.time}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 cu-card p-3 animate-float-delay" style={{ background: "linear-gradient(135deg, var(--teal-light), #EAF8F2)", border: "1px solid #B7E8D5" }}>
                                <div className="cu-ml-badge"><Sparkles size={10} /> Insight</div>
                                <div className="text-xs mt-1 max-w-[180px]" style={{ color: "var(--teal-d)" }}>
                                    78% of your headaches follow high-pollen days.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
                <div className="text-center mb-12 cu-fade-up">
                    <div className="text-xs font-medium mb-3" style={{ color: "var(--teal-d)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Everything you need</div>
                    <h2 className="text-4xl md:text-5xl font-semibold" style={{ letterSpacing: "-0.025em" }}>One platform, one timeline, full clarity.</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                        <div key={i} className="cu-card cu-card-hover cu-fade-up" style={{ animationDelay: `${i * 60}ms` }} data-testid={`feature-${i}`}>
                            <div className="cu-stat-icon mb-3" style={{ background: f.bg }}>
                                <f.Icon size={18} color={f.color} />
                            </div>
                            <div className="text-base font-semibold">{f.title}</div>
                            <div className="text-sm mt-1.5" style={{ color: "var(--text2)" }}>{f.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="px-6 md:px-12 pb-16 max-w-7xl mx-auto">
                <div className="rounded-3xl p-10 md:p-16 text-center" style={{ background: "linear-gradient(135deg, var(--teal-light) 0%, #EAF8F2 100%)", border: "1px solid #B7E8D5" }}>
                    <h2 className="text-3xl md:text-4xl font-semibold" style={{ letterSpacing: "-0.02em" }}>Start understanding your body today.</h2>
                    <p className="mt-3 text-base max-w-2xl mx-auto" style={{ color: "var(--text2)" }}>
                        Free during beta. Whether you're tracking your own health or caring for patients, Curasana adapts to you.
                    </p>
                    <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={handleStart}
                            className="cu-btn cu-btn-primary"
                            style={{ padding: "14px 24px", fontSize: 15 }}
                            data-testid="cta-get-started"
                        >
                            Get Started Free <ArrowRight size={16} />
                        </button>
                        <Link to="/login" className="cu-btn cu-btn-secondary" style={{ padding: "14px 24px", fontSize: 14 }} data-testid="cta-login">
                            Log in
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="px-6 md:px-12 py-8 max-w-7xl mx-auto flex items-center justify-between text-xs" style={{ color: "var(--text3)", borderTop: "1px solid var(--border-soft)" }}>
                <div>© {new Date().getFullYear()} Curasana Health</div>
                <div className="flex gap-4">
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Contact</span>
                </div>
            </footer>

            <style>{`
                @keyframes cu-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes cu-pulse-slow {
                    0%, 100% { opacity: 0.4; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.05); }
                }
                .animate-float { animation: cu-float 6s ease-in-out infinite; }
                .animate-float-delay { animation: cu-float 7s ease-in-out infinite; animation-delay: 1.2s; }
                .animate-pulse-slow { animation: cu-pulse-slow 8s ease-in-out infinite; }
            `}</style>
        </div>
    );
}








