import React from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard, Activity, Pill, AlertCircle, Clock,
    BarChart3, FileText, Users, Brain, Settings as SettingsIcon,
    Bell, Plus, FileOutput, LogOut, Heart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/symptoms", label: "Symptoms", icon: Activity },
    { to: "/medications", label: "Medications", icon: Pill },
    { to: "/allergies", label: "Allergies", icon: AlertCircle },
    { to: "/timeline", label: "Timeline", icon: Clock },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/reports", label: "Doctor Reports", icon: FileText },
    { to: "/community", label: "Community", icon: Users },
    { to: "/ml-insights", label: "ML Insights", icon: Brain },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const TITLES = {
    "/dashboard": { title: "Good morning", sub: () => new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
    "/symptoms": { title: "Symptoms", sub: () => "Track your physical signals over time" },
    "/medications": { title: "Medications", sub: () => "Daily schedule and full prescription log" },
    "/allergies": { title: "Allergies", sub: () => "Known sensitivities and emergency info" },
    "/timeline": { title: "Health Timeline", sub: () => "Everything that happened, in order" },
    "/analytics": { title: "Analytics", sub: () => "Visual insights from your health data" },
    "/reports": { title: "Doctor Reports", sub: () => "Generate sharable summaries for your care team" },
    "/community": { title: "Community Trends", sub: () => "Anonymized regional health insights" },
    "/ml-insights": { title: "ML Insights", sub: () => "Patterns and correlations from your data" },
    "/settings": { title: "Settings", sub: () => "Profile, privacy and notifications" },
};

export default function Layout() {
    const loc = useLocation();
    const { user, logout } = useAuth();
    const meta = TITLES[loc.pathname] || TITLES["/dashboard"];
    const onDashboard = loc.pathname === "/dashboard";
    const firstName = (user?.name || "").split(" ")[0] || "there";

    const initials = (name = "") => name.split(" ").map(n => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U";

    return (
        <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
            <aside className="w-64 shrink-0 sticky top-0 h-screen overflow-y-auto" style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }} data-testid="sidebar">
                <Link to="/dashboard" className="flex items-center gap-2 px-5 pt-6 pb-5" data-testid="brand-link">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--teal)" }}>
                        <Heart size={18} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="text-lg font-semibold" style={{ letterSpacing: "-0.02em" }}>Curasana</div>
                        <div className="text-[10px]" style={{ color: "var(--text3)" }}>HEALTH PLATFORM</div>
                    </div>
                </Link>
                <nav className="px-3 pb-3" data-testid="primary-nav">
                    {NAV.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `cu-nav-item ${isActive ? "active" : ""}`}
                            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                            <Icon size={17} strokeWidth={2} />
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-2 mx-3 p-3 rounded-xl" style={{ background: "var(--gray-soft)" }}>
                    <div className="flex items-center gap-3">
                        <div className="cu-avatar" data-testid="sidebar-avatar">
                            {user?.picture ? <img src={user.picture} alt="" /> : initials(user?.name)}
                        </div>
                        <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{user?.name}</div>
                            <div className="text-[11px]" style={{ color: "var(--text3)" }}>{user?.email}</div>
                        </div>
                    </div>
                    <button type="button" onClick={logout} className="cu-btn cu-btn-ghost mt-3" style={{ width: "100%", justifyContent: "center", fontSize: 12 }} data-testid="sidebar-logout">
                        <LogOut size={12} /> Sign out
                    </button>
                </div>
            </aside>

            <main className="flex-1 min-w-0">
                <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-30" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border-soft)" }} data-testid="topbar">
                    <div>
                        <div className="text-xl font-semibold" style={{ letterSpacing: "-0.02em" }} data-testid="topbar-title">
                            {onDashboard ? `Good morning, ${firstName} 👋` : meta.title}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text3)" }} data-testid="topbar-sub">
                            {meta.sub()}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/symptoms" className="cu-btn cu-btn-ghost" data-testid="topbar-log-symptom">
                            <Plus size={14} /> Log Symptom
                        </Link>
                        <Link to="/reports" className="cu-btn cu-btn-primary" data-testid="topbar-generate-report">
                            <FileOutput size={14} /> Generate Report
                        </Link>
                        <button className="cu-icon-btn" data-testid="topbar-notif" type="button">
                            <Bell size={16} />
                        </button>
                    </div>
                </div>
                <div className="p-8 max-w-[1400px]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
